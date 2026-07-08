// pages/classifieds/post.tsx
// ─── POST A CLASSIFIED AD ────────────────────────────────────────

import Head              from "next/head";
import { useRouter }     from "next/router";
import { useState, useRef, useEffect } from "react";
import toast              from "react-hot-toast";
import Layout             from "@/components/Layout";
import AddressAutocompleteInput from "@/components/AddressAutocompleteInput";
import { useAuth }        from "@/context/AuthContext";
import {
  createClassified, updateClassified, getClassified,
  CLASSIFIED_CATEGORIES, PROVINCES,
  VEHICLE_CATEGORY, REAL_ESTATE_CATEGORY,
  TRANSMISSION_OPTIONS, DRIVE_TYPE_OPTIONS, FUEL_TYPE_OPTIONS,
  PROPERTY_TYPE_OPTIONS, LISTING_TYPE_OPTIONS,
} from "@/services/classifiedService";
import { geocodeAddress } from "@/lib/googleMaps";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export default function PostClassifiedPage() {
  const { user, userDoc, isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const { edit } = router.query;
  const isEditMode = !!edit;
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving,      setSaving]    = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [images,    setImages]    = useState<File[]>([]);
  const [previews,  setPreviews]  = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [form, setForm] = useState({
    title:       "",
    description: "",
    price:       "",
    currency:    "CAD",
    priceType:   "fixed" as "fixed"|"negotiable"|"free"|"contact",
    category:    "",
    subCategory: "",
    condition:   "good" as any,
    city:        "",
    province:    "Ontario",
    country:     "Canada",
    useEscrow:   false,
    tags:        "",
    phone:       "",
    whatsapp:    "",
  });

  // Cars & Vehicles specific fields
  const [vehicle, setVehicle] = useState({
    year:          "",
    make:          "",
    model:         "",
    mileageKm:     "",
    transmission:  "" as "" | "Automatic" | "Manual",
    driveType:     "" as "" | "FWD" | "RWD" | "AWD",
    fuelType:      "" as "" | "Gas" | "Hybrid" | "Electric" | "Diesel",
    exteriorColor: "",
    vin:           "",
  });

  // Real Estate specific fields
  const [realEstate, setRealEstate] = useState({
    listingType:  "" as "" | "For Sale" | "For Rent",
    propertyType: "" as "" | "House" | "Condo" | "Apartment" | "Room" | "Townhouse" | "Land" | "Commercial",
    bedrooms:     "",
    bathrooms:    "",
    sqft:         "",
    address:      "",
    lat:          undefined as number | undefined,
    lng:          undefined as number | undefined,
  });

  if (!loading && !isLoggedIn) {
    router.push("/auth/login?redirect=/classifieds/post");
    return null;
  }

  // Require phone verification before anyone can post a listing —
  // same anti-fraud gate used for sellers creating a shop.
  if (!loading && isLoggedIn && !userDoc?.phoneVerified) {
    router.push("/auth/verify-phone?redirect=/classifieds/post");
    return null;
  }

  function up(field: string, value: any) {
    setForm(f => ({...f, [field]: value}));
  }
  function upVehicle(field: string, value: any) {
    setVehicle(v => ({...v, [field]: value}));
  }
  function upRealEstate(field: string, value: any) {
    setRealEstate(r => ({...r, [field]: value}));
  }

  // Load existing listing in edit mode
  useEffect(() => {
    if (!edit) return;
    setEditLoading(true);
    getClassified(edit as string).then(listing => {
      if (!listing) return;
      setForm({
        title:       listing.title,
        description: listing.description,
        category:    listing.category,
        subCategory: listing.subCategory,
        condition:   listing.condition,
        priceType:   listing.priceType,
        price:       listing.price ? String(listing.price) : "",
        currency:    listing.currency || "CAD",
        province:    listing.province,
        city:        listing.city,
        country:     listing.country,
        useEscrow:   listing.useEscrow,
        tags:        listing.tags?.join(", ") || "",
        phone:       (listing as any).phone || "",
        whatsapp:    (listing as any).whatsapp || "",
      });
      if (listing.vehicleDetails) {
        const vd = listing.vehicleDetails;
        setVehicle({
          year:          vd.year ? String(vd.year) : "",
          make:          vd.make || "",
          model:         vd.model || "",
          mileageKm:     vd.mileageKm ? String(vd.mileageKm) : "",
          transmission:  vd.transmission || "",
          driveType:     vd.driveType || "",
          fuelType:      vd.fuelType || "",
          exteriorColor: vd.exteriorColor || "",
          vin:           vd.vin || "",
        });
      }
      if (listing.realEstateDetails) {
        const rd = listing.realEstateDetails;
        setRealEstate({
          listingType:  rd.listingType || "",
          propertyType: rd.propertyType || "",
          bedrooms:     rd.bedrooms ? String(rd.bedrooms) : "",
          bathrooms:    rd.bathrooms ? String(rd.bathrooms) : "",
          sqft:         rd.sqft ? String(rd.sqft) : "",
          address:      rd.address || "",
          lat:          rd.lat,
          lng:          rd.lng,
        });
      }
      // Show existing images as previews
      if (listing.images?.length) setPreviews(listing.images);
      setEditLoading(false);
    });
  }, [edit]);

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

  async function uploadImages(): Promise<string[]> {
    if (images.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    for (const file of images) {
      const storageRef = ref(storage, `classifieds/${user!.uid}/${Date.now()}-${file.name}`);
      const task = uploadBytesResumable(storageRef, file);
      await new Promise((res, rej) => task.on("state_changed", null, rej, res as any));
      urls.push(await getDownloadURL(task.snapshot.ref));
    }
    setUploading(false);
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !userDoc) return;
    if (!form.title || !form.category || !form.city) {
      toast.error("Please fill in title, category and city");
      return;
    }
    setSaving(true);
    try {
      // Only upload new images; keep existing previews that are URLs (not File objects)
      const newImageUrls = await uploadImages();
      const existingUrls = previews.filter(p => p.startsWith("http"));
      const allImages = [...existingUrls, ...newImageUrls];

      // If it's a Real Estate listing and we don't have coordinates yet
      // (user typed the address instead of picking an autocomplete result),
      // try to geocode it now so the map pin still works.
      let reLat = realEstate.lat;
      let reLng = realEstate.lng;
      let reAddress = realEstate.address;
      if (form.category === REAL_ESTATE_CATEGORY && realEstate.address && (!reLat || !reLng)) {
        setGeocoding(true);
        const geocoded = await geocodeAddress(realEstate.address);
        setGeocoding(false);
        if (geocoded) {
          reLat = geocoded.lat;
          reLng = geocoded.lng;
          reAddress = geocoded.formattedAddress;
        }
      }

      const data: any = {
        title:       form.title,
        description: form.description,
        price:       parseFloat(form.price) || 0,
        currency:    form.currency,
        priceType:   form.priceType,
        category:    form.category,
        subCategory: form.subCategory,
        images:      allImages,
        city:        form.city,
        province:    form.province,
        country:     form.country,
        condition:   form.condition,
        useEscrow:   form.useEscrow,
        tags:        form.tags.split(",").map(t=>t.trim()).filter(Boolean),
        phone:       form.phone,
        whatsapp:    form.whatsapp,
      };

      // Attach category-specific details, and explicitly clear out the
      // other category's details (use null, not undefined — Firestore
      // rejects undefined field values) in case the seller switched
      // categories while editing an existing listing.
      if (form.category === VEHICLE_CATEGORY) {
        data.vehicleDetails = {
          year:          vehicle.year ? parseInt(vehicle.year) : null,
          make:          vehicle.make || "",
          model:         vehicle.model || "",
          mileageKm:     vehicle.mileageKm ? parseInt(vehicle.mileageKm) : null,
          transmission:  vehicle.transmission || "",
          driveType:     vehicle.driveType || "",
          fuelType:      vehicle.fuelType || "",
          exteriorColor: vehicle.exteriorColor || "",
          vin:           vehicle.vin || "",
        };
        data.realEstateDetails = null;
      } else if (form.category === REAL_ESTATE_CATEGORY) {
        data.realEstateDetails = {
          listingType:  realEstate.listingType || "",
          propertyType: realEstate.propertyType || "",
          bedrooms:     realEstate.bedrooms ? parseInt(realEstate.bedrooms) : null,
          bathrooms:    realEstate.bathrooms ? parseFloat(realEstate.bathrooms) : null,
          sqft:         realEstate.sqft ? parseInt(realEstate.sqft) : null,
          address:      reAddress || "",
          lat:          reLat ?? null,
          lng:          reLng ?? null,
        };
        data.vehicleDetails = null;
      } else {
        data.vehicleDetails = null;
        data.realEstateDetails = null;
      }

      if (isEditMode) {
        await updateClassified(edit as string, data);
        toast.success("Listing updated! ✅");
        router.push(`/classifieds/${edit}`);
      } else {
        const id = await createClassified({
          sellerId:    user.uid,
          sellerName:  userDoc.displayName,
          sellerPhoto: userDoc.photoURL || "",
          status:      "active",
          featuredUntil: null,
          ...data,
        });
        toast.success("Ad posted! 🎉");
        router.push(`/classifieds/${id}`);
      }
    } catch (err: any) {
      console.error("Post ad error:", err);
      toast.error(err?.message || "Failed to post ad — check console");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-4 py-3 rounded-xl border text-sm font-dm-sans focus:outline-none transition-colors";
  const inpStyle = {background:"#fff",borderColor:"#D4CFC6",color:"#1A1714"};
  const subCategories = form.category ? (CLASSIFIED_CATEGORIES as any)[form.category] || [] : [];
  const isVehicle    = form.category === VEHICLE_CATEGORY;
  const isRealEstate = form.category === REAL_ESTATE_CATEGORY;

  return (
    <>
      <Head><title>{isEditMode ? "Edit Listing" : "Post an Ad"} — Planet Mall Classifieds</title></Head>
      <Layout>
        <div className="min-h-screen pb-20 px-4" style={{background:"#F6F1E9"}}>
          <div className="max-w-2xl mx-auto pt-8">

            <div className="mb-8">
              <h1 className="font-syne font-bold text-3xl mb-1" style={{color:"#1A1714"}}>{isEditMode ? "Edit listing" : "Post an ad"}</h1>
              <p className="text-sm font-dm-sans" style={{color:"#8A8480"}}>Free to post. Reach buyers across Canada and worldwide.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Images */}
              <div className="p-6 rounded-2xl" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg mb-4" style={{color:"#1A1714"}}>Photos</h2>
                <div className="flex gap-3 flex-wrap mb-3">
                  {previews.map((p,i)=>(
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={()=>{
                        setImages(imgs=>imgs.filter((_,j)=>j!==i));
                        setPreviews(ps=>ps.filter((_,j)=>j!==i));
                      }} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  {previews.length < 5 && (
                    <button type="button" onClick={()=>fileRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1"
                      style={{borderColor:"#D4CFC6"}}>
                      <span className="text-2xl">📷</span>
                      <span className="text-[10px] font-dm-sans" style={{color:"#8A8480"}}>Add photo</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Up to 5 photos. First photo is your cover image.</p>
              </div>

              {/* Basic info */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Ad details</h2>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Title *</label>
                  <input className={inp} style={inpStyle} value={form.title} onChange={e=>up("title",e.target.value)}
                    placeholder="e.g. 2019 Honda Civic - Low mileage"
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Category *</label>
                    <select className={inp} style={inpStyle} value={form.category} onChange={e=>{up("category",e.target.value);up("subCategory","")}}
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}}>
                      <option value="">Select category</option>
                      {Object.keys(CLASSIFIED_CATEGORIES).map(c=>(
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {subCategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Sub-category</label>
                      <select className={inp} style={inpStyle} value={form.subCategory} onChange={e=>up("subCategory",e.target.value)}
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}}>
                        <option value="">Select</option>
                        {subCategories.map((s: string)=>(
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Description</label>
                  <textarea className={`${inp} resize-none`} style={inpStyle} rows={5}
                    value={form.description} onChange={e=>up("description",e.target.value)}
                    placeholder="Describe your item in detail — condition, features, reason for selling..."
                    onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                </div>
                <div>
                  <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Condition</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      {v:"new",label:"New"},
                      {v:"like_new",label:"Like New"},
                      {v:"good",label:"Good"},
                      {v:"fair",label:"Fair"},
                      {v:"parts_only",label:"Parts Only"},
                      {v:"na",label:"N/A"},
                    ].map(({v,label})=>(
                      <button key={v} type="button" onClick={()=>up("condition",v)}
                        className="px-3 py-1.5 rounded-xl text-xs font-dm-sans font-medium transition-all"
                        style={{
                          background: form.condition===v?"#C4531A":"#F6F1E9",
                          color:      form.condition===v?"#fff":"#8A8480",
                          border:     `1px solid ${form.condition===v?"#C4531A":"#D4CFC6"}`,
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cars & Vehicles specific fields */}
              {isVehicle && (
                <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>🚗 Vehicle details</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Year</label>
                      <input className={inp} style={inpStyle} type="number" value={vehicle.year} onChange={e=>upVehicle("year",e.target.value)}
                        placeholder="2019"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Make</label>
                      <input className={inp} style={inpStyle} value={vehicle.make} onChange={e=>upVehicle("make",e.target.value)}
                        placeholder="Honda"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Model</label>
                      <input className={inp} style={inpStyle} value={vehicle.model} onChange={e=>upVehicle("model",e.target.value)}
                        placeholder="Civic"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Mileage (km)</label>
                      <input className={inp} style={inpStyle} type="number" value={vehicle.mileageKm} onChange={e=>upVehicle("mileageKm",e.target.value)}
                        placeholder="85000"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Exterior color</label>
                      <input className={inp} style={inpStyle} value={vehicle.exteriorColor} onChange={e=>upVehicle("exteriorColor",e.target.value)}
                        placeholder="Silver"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Transmission</label>
                    <div className="flex gap-2 flex-wrap">
                      {TRANSMISSION_OPTIONS.map(v=>(
                        <button key={v} type="button" onClick={()=>upVehicle("transmission",v)}
                          className="px-3 py-1.5 rounded-xl text-xs font-dm-sans font-medium transition-all"
                          style={{
                            background: vehicle.transmission===v?"#C4531A":"#F6F1E9",
                            color:      vehicle.transmission===v?"#fff":"#8A8480",
                            border:     `1px solid ${vehicle.transmission===v?"#C4531A":"#D4CFC6"}`,
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Drive type</label>
                    <div className="flex gap-2 flex-wrap">
                      {DRIVE_TYPE_OPTIONS.map(v=>(
                        <button key={v} type="button" onClick={()=>upVehicle("driveType",v)}
                          className="px-3 py-1.5 rounded-xl text-xs font-dm-sans font-medium transition-all"
                          style={{
                            background: vehicle.driveType===v?"#C4531A":"#F6F1E9",
                            color:      vehicle.driveType===v?"#fff":"#8A8480",
                            border:     `1px solid ${vehicle.driveType===v?"#C4531A":"#D4CFC6"}`,
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Fuel type</label>
                    <div className="flex gap-2 flex-wrap">
                      {FUEL_TYPE_OPTIONS.map(v=>(
                        <button key={v} type="button" onClick={()=>upVehicle("fuelType",v)}
                          className="px-3 py-1.5 rounded-xl text-xs font-dm-sans font-medium transition-all"
                          style={{
                            background: vehicle.fuelType===v?"#C4531A":"#F6F1E9",
                            color:      vehicle.fuelType===v?"#fff":"#8A8480",
                            border:     `1px solid ${vehicle.fuelType===v?"#C4531A":"#D4CFC6"}`,
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>VIN <span className="font-normal" style={{color:"#8A8480"}}>(optional — lets buyers run a Carfax-style history check)</span></label>
                    <input className={inp} style={inpStyle} value={vehicle.vin} onChange={e=>upVehicle("vin",e.target.value.toUpperCase())}
                      placeholder="1HGCM82633A123456" maxLength={17}
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                  </div>
                </div>
              )}

              {/* Real Estate specific fields */}
              {isRealEstate && (
                <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                  <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>🏠 Property details</h2>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Listing type</label>
                    <div className="flex gap-2 flex-wrap">
                      {LISTING_TYPE_OPTIONS.map(v=>(
                        <button key={v} type="button" onClick={()=>upRealEstate("listingType",v)}
                          className="px-3 py-1.5 rounded-xl text-xs font-dm-sans font-medium transition-all"
                          style={{
                            background: realEstate.listingType===v?"#C4531A":"#F6F1E9",
                            color:      realEstate.listingType===v?"#fff":"#8A8480",
                            border:     `1px solid ${realEstate.listingType===v?"#C4531A":"#D4CFC6"}`,
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Property type</label>
                    <div className="flex gap-2 flex-wrap">
                      {PROPERTY_TYPE_OPTIONS.map(v=>(
                        <button key={v} type="button" onClick={()=>upRealEstate("propertyType",v)}
                          className="px-3 py-1.5 rounded-xl text-xs font-dm-sans font-medium transition-all"
                          style={{
                            background: realEstate.propertyType===v?"#C4531A":"#F6F1E9",
                            color:      realEstate.propertyType===v?"#fff":"#8A8480",
                            border:     `1px solid ${realEstate.propertyType===v?"#C4531A":"#D4CFC6"}`,
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Bedrooms</label>
                      <input className={inp} style={inpStyle} type="number" min="0" value={realEstate.bedrooms} onChange={e=>upRealEstate("bedrooms",e.target.value)}
                        placeholder="3"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Bathrooms</label>
                      <input className={inp} style={inpStyle} type="number" min="0" step="0.5" value={realEstate.bathrooms} onChange={e=>upRealEstate("bathrooms",e.target.value)}
                        placeholder="2"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Sq. footage</label>
                      <input className={inp} style={inpStyle} type="number" min="0" value={realEstate.sqft} onChange={e=>upRealEstate("sqft",e.target.value)}
                        placeholder="1200"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Address</label>
                    <AddressAutocompleteInput
                      value={realEstate.address}
                      onChange={v => upRealEstate("address", v)}
                      onPlaceSelected={place => {
                        setRealEstate(r => ({...r, address: place.address, lat: place.lat, lng: place.lng}));
                        if (place.city) up("city", place.city);
                        if (place.province) up("province", place.province);
                      }}
                      placeholder="Start typing an address..."
                      className={inp}
                      style={inpStyle}
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}}
                      onBlur={e=>{e.target.style.borderColor="#D4CFC6"}}
                    />
                    <p className="text-xs font-dm-sans mt-1.5" style={{color:"#8A8480"}}>
                      Pick a suggestion from the dropdown so we can drop an accurate pin on the map. This address is shown publicly on the listing — for rentals, consider using just the street name if you'd rather not reveal the exact unit.
                    </p>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Price</h2>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {v:"fixed",    label:"Fixed price"},
                    {v:"negotiable",label:"Negotiable (OBO)"},
                    {v:"free",     label:"Free"},
                    {v:"contact",  label:"Contact for price"},
                  ].map(({v,label})=>(
                    <button key={v} type="button" onClick={()=>up("priceType",v)}
                      className="px-4 py-2 rounded-xl text-sm font-dm-sans font-medium transition-all"
                      style={{
                        background: form.priceType===v?"#C4531A":"#F6F1E9",
                        color:      form.priceType===v?"#fff":"#8A8480",
                        border:     `1px solid ${form.priceType===v?"#C4531A":"#D4CFC6"}`,
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
                {(form.priceType === "fixed" || form.priceType === "negotiable") && (
                  <div className="space-y-3">
                    {/* Currency selector */}
                    <div>
                      <label className="block text-xs font-dm-sans mb-1.5" style={{color:"#8A8480"}}>Currency</label>
                      <select className={inp} style={inpStyle} value={form.currency} onChange={e=>up("currency",e.target.value)}>
                        {[
                          {code:"CAD", label:"🇨🇦 CAD — Canadian Dollar"},
                          {code:"USD", label:"🇺🇸 USD — US Dollar"},
                          {code:"GBP", label:"🇬🇧 GBP — British Pound"},
                          {code:"EUR", label:"🇪🇺 EUR — Euro"},
                          {code:"JPY", label:"🇯🇵 JPY — Japanese Yen"},
                          {code:"GHS", label:"🇬🇭 GHS — Ghanaian Cedi"},
                          {code:"NGN", label:"🇳🇬 NGN — Nigerian Naira"},
                          {code:"KES", label:"🇰🇪 KES — Kenyan Shilling"},
                          {code:"ZAR", label:"🇿🇦 ZAR — South African Rand"},
                          {code:"AUD", label:"🇦🇺 AUD — Australian Dollar"},
                          {code:"INR", label:"🇮🇳 INR — Indian Rupee"},
                          {code:"CNY", label:"🇨🇳 CNY — Chinese Yuan"},
                          {code:"AED", label:"🇦🇪 AED — UAE Dirham"},
                          {code:"OTHER", label:"Other"},
                        ].map(c=>(
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Price input */}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-dm-sans font-semibold text-sm" style={{color:"#8A8480"}}>{form.currency}</span>
                      <input className={`${inp} pl-16`} style={inpStyle} type="number" value={form.price} onChange={e=>up("price",e.target.value)}
                        placeholder="0.00"
                        onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                    </div>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Location</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>City *</label>
                    <input className={inp} style={inpStyle} value={form.city} onChange={e=>up("city",e.target.value)}
                      placeholder="e.g. Toronto"
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Province</label>
                    <select className={inp} style={inpStyle} value={form.province} onChange={e=>up("province",e.target.value)}
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}}>
                      {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="p-6 rounded-2xl space-y-4" style={{background:"#fff",border:"1px solid #E8E2D9"}}>
                <h2 className="font-syne font-bold text-lg" style={{color:"#1A1714"}}>Contact information</h2>
                <p className="text-xs font-dm-sans" style={{color:"#8A8480"}}>Let buyers know how to reach you directly.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>Phone number</label>
                    <input className={inp} style={inpStyle} type="tel" value={form.phone} onChange={e=>up("phone",e.target.value)}
                      placeholder="+1 (416) 000-0000"
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold font-syne mb-1.5" style={{color:"#1A1714"}}>WhatsApp (optional)</label>
                    <input className={inp} style={inpStyle} type="tel" value={form.whatsapp} onChange={e=>up("whatsapp",e.target.value)}
                      placeholder="+1 (416) 000-0000"
                      onFocus={e=>{e.target.style.borderColor="#C4531A"}} onBlur={e=>{e.target.style.borderColor="#D4CFC6"}} />
                  </div>
                </div>
              </div>

              {/* Escrow option */}
              <div className="p-5 rounded-2xl" style={{background:"rgba(42,107,69,0.06)",border:"1px solid rgba(42,107,69,0.2)"}}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.useEscrow} onChange={e=>up("useEscrow",e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-green flex-shrink-0" />
                  <div>
                    <p className="font-dm-sans font-semibold text-sm" style={{color:"#2A6B45"}}>
                      🔐 Use Planet Mall Escrow Protection
                    </p>
                    <p className="text-xs font-dm-sans mt-0.5" style={{color:"#2A6B45"}}>
                      Buyers pay through Planet Mall. You receive payment after buyer confirms delivery. Builds more trust and gets more buyers.
                    </p>
                  </div>
                </label>
              </div>

              <button type="submit" disabled={saving || uploading || geocoding}
                className="w-full py-4 rounded-xl text-white font-dm-sans font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{background:"#C4531A"}}>
                {saving || uploading || geocoding
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{uploading?"Uploading photos...":geocoding?"Locating address...":isEditMode?"Saving changes...":"Posting ad..."}</>
                  : isEditMode ? "Save changes →" : "Post ad for free →"}
              </button>
              <p className="text-xs text-center font-dm-sans" style={{color:"#8A8480"}}>
                Free listing for 30 days. Boost to featured for CA$0.99.
              </p>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
