 "use client";
import {useEffect,useState} from "react";
import {supabaseBrowser} from "@/lib/supabase";
import {ArrowLeft,Trash2,RefreshCw,LogOut} from "lucide-react";

type Product={id:string;nombre:string|null;name?:string;precio:number|null;price?:number;imagen:string|null;image?:string;categoria:string|null;category?:string;stock:number|null;is_best_seller:boolean|null;is_active:boolean|null};
type Order={id:string;order_code:string;nombre:string;whatsapp:string;productos:any[];total:number;status:string;created_at:string};

const money=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS"}).format(n);

export default function Admin(){
 const s=supabaseBrowser();
 const [user,setUser]=useState<any>(null),[allowed,setAllowed]=useState(false),[email,setEmail]=useState(""),[pass,setPass]=useState(""),[products,setProducts]=useState<Product[]>([]),[orders,setOrders]=useState<Order[]>([]),[msg,setMsg]=useState(""),[editing,setEditing]=useState<string|null>(null),[name,setName]=useState(""),[price,setPrice]=useState(""),[category,setCategory]=useState(""),[stock,setStock]=useState("10"),[best,setBest]=useState(false),[active,setActive]=useState(true),[image,setImage]=useState<File|null>(null),[saving,setSaving]=useState(false),[loading,setLoading]=useState(true);

 useEffect(()=>{check()},[]);

 async function check(){
  setLoading(true);
  const {data:{user:u}}=await s.auth.getUser();
  if(!u){setLoading(false);return}
  setUser(u);
  // Verificamos rol admin sin recursión
  const {data:profile}=await s.from("profiles").select("role").eq("id",u.id).maybeSingle();
  if(profile?.role==="admin"){setAllowed(true); await Promise.all([loadProducts(),loadOrders()])}
  else{setMsg("Esta cuenta no es admin. Andá a Supabase y poné role='admin' en profiles")}
  setLoading(false);
 }

 async function doLogin(e:React.FormEvent){
  e.preventDefault(); setMsg("Ingresando...");
  const {data,error}=await s.auth.signInWithPassword({email,password:pass});
  if(error){setMsg(error.message);return}
  setUser(data.user); 
  // Auto-crear profile como admin si no existe (para que no te bloquee)
  await s.from("profiles").upsert({id:data.user.id,email,role:"admin"},{onConflict:"id"});
  setAllowed(true); setMsg("¡Bienvenido Admin!"); await Promise.all([loadProducts(),loadOrders()]);
 }

 async function doLogout(){await s.auth.signOut(); setUser(null); setAllowed(false); setEmail(""); setPass("");}

 async function loadProducts(){const {data}=await s.from("products").select("*").order("created_at",{ascending:false}); setProducts((data||[]) as Product[])}
 async function loadOrders(){const {data}=await s.from("orders").select("*").order("created_at",{ascending:false}); setOrders((data||[]) as Order[])}
 function reset(){setEditing(null);setName("");setPrice("");setCategory("");setStock("10");setBest(false);setActive(true);setImage(null)}
 function edit(p:Product){setEditing(p.id);setName(p.nombre||p.name||"");setPrice(String(p.precio??p.price??0));setCategory(p.categoria||p.category||"");setStock(String(p.stock??10));setBest(!!p.is_best_seller);setActive(p.is_active!==false);setImage(null);window.scrollTo({top:0,behavior:"smooth"})}

 async function save(e:React.FormEvent){
  e.preventDefault();setSaving(true);setMsg("");
  try{
    let imageUrl:string|undefined;
    if(image){
      const path=`${user.id}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
      const {error:upErr}=await s.storage.from("products").upload(path,image,{upsert:true,contentType:image.type});
      if(upErr) throw upErr;
      imageUrl=s.storage.from("products").getPublicUrl(path).data.publicUrl;
    }
    const payload:any={nombre:name,precio:Number(price),categoria:category,stock:Number(stock),is_best_seller:best,is_active:active, ...(imageUrl?{imagen:imageUrl}:{})};
    const result=editing?s.from("products").update(payload).eq("id",editing):s.from("products").insert(payload);
    const {error}=await result; if(error) throw error;
    setMsg("Producto guardado ✔"); reset(); await loadProducts();
  }catch(e:any){setMsg(e.message||"Error al guardar")}finally{setSaving(false)}
 }

 async function remove(p:Product){if(!confirm("¿Eliminar?"))return; const {error}=await s.from("products").delete().eq("id",p.id); if(error)setMsg(error.message); else await loadProducts()}
 async function updateStatus(o:Order,status:string){await s.from("orders").update({status}).eq("id",o.id); await loadOrders()}

 if(loading) return <main className="wrap"><p className="muted">Cargando...</p></main>;

 // PANTALLA DE LOGIN
 if(!allowed) return (
  <main className="wrap" style={{maxWidth:400,margin:"80px auto"}}>
    <a href="/" style={{color:"#ddd",display:"inline-flex",gap:8,alignItems:"center",marginBottom:20}}><ArrowLeft size={17}/> Volver a la tienda</a>
    <div className="panel">
      <h1>Admin MDC</h1>
      <p className="muted">Ingresá con tu cuenta de administrador</p>
      <form onSubmit={doLogin} style={{display:"grid",gap:12,marginTop:20}}>
        <label>Email<input required type="email" className="field" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com"/></label>
        <label>Contraseña<input required type="password" className="field" value={pass} onChange={e=>setPass(e.target.value)}/></label>
        <button className="btn" type="submit">Entrar como Admin</button>
      </form>
      {msg&&<p className="muted" style={{marginTop:12,color:"tomato"}}>{msg}</p>}
      <p className="muted" style={{marginTop:16,fontSize:12}}>¿Primera vez? Creá el usuario en Supabase &gt; Authentication &gt; Users y después logueate acá. Se hará admin automáticamente.</p>
    </div>
  </main>
 );

 // PANEL ADMIN
 return <main className="wrap"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><a href="/" style={{color:"#ddd",display:"inline-flex",gap:8,alignItems:"center"}}><ArrowLeft size={17}/> Tienda</a><button className="btn btn-ghost" onClick={doLogout}><LogOut size={14}/> Salir ({user.email})</button></div>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginTop:10}}><div><div className="muted" style={{fontSize:12,letterSpacing:2}}>PANEL PRIVADO</div><h1>Administración MDC</h1></div><button className="btn btn-ghost" onClick={()=>void Promise.all([loadProducts(),loadOrders()])}><RefreshCw size={15}/> Actualizar</button></div>{msg&&<p className="muted">{msg}</p>}
 <section className="panel" style={{margin:"24px 0"}}><h2>{editing?"Editar producto":"Nuevo producto"}</h2><form onSubmit={save} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}><label>Nombre<input required className="field" value={name} onChange={e=>setName(e.target.value)}/></label><label>Precio<input required min="0" type="number" step="0.01" className="field" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>Categoría<input required className="field" value={category} onChange={e=>setCategory(e.target.value)}/></label><label>Stock<input required min="0" type="number" className="field" value={stock} onChange={e=>setStock(e.target.value)}/></label><label>Imagen<input type="file" accept="image/*" className="field" onChange={e=>setImage(e.target.files?.[0]||null)}/></label><label style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={best} onChange={e=>setBest(e.target.checked)}/> Más vendido</label><label style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Publicado</label><div style={{display:"flex",gap:8,alignItems:"end"}}><button className="btn" disabled={saving}>{saving?"Guardando…":editing?"Guardar cambios":"Crear producto"}</button>{editing&&<button type="button" className="btn btn-ghost" onClick={reset}>Cancelar</button>}</div></form></section>
 <section><h2>Productos ({products.length})</h2><div className="product-grid">{products.map(p=><article className="panel" key={p.id}><img className="product-img" src={p.imagen||p.image||"https://placehold.co/400x300/222/fff?text=MDC"} alt=""/><h3>{p.nombre||p.name}</h3><p>{money(Number(p.precio??p.price??0))} · stock {p.stock}</p><p className="muted">{p.is_active?"Publicado":"Oculto"}{p.is_best_seller?" · Más vendido":""}</p><div style={{display:"flex",gap:8}}><button className="btn btn-ghost" onClick={()=>edit(p)}>Editar</button><button className="btn btn-ghost" onClick={()=>void remove(p)}><Trash2 size={15}/></button></div></article>)}</div></section>
 <section style={{marginTop:40}}><h2>Pedidos ({orders.length})</h2>{orders.length===0?<p className="muted">Todavía no hay pedidos.</p>:<div style={{display:"grid",gap:12}}>{orders.map(o=><article className="panel" key={o.id}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><b>{o.order_code}</b><p style={{margin:"7px 0"}}>{o.nombre} · {o.whatsapp}</p><p className="muted">{new Date(o.created_at).toLocaleString("es-AR")} · {(o.productos||[]).map((p:any)=>`${p.nombre||p.name} ×${p.cantidad||p.qty}`).join(", ")}</p><b>{money(Number(o.total))}</b></div><div style={{display:"flex",gap:8,alignItems:"start",flexWrap:"wrap"}}><a className="btn" style={{textDecoration:"none"}} target="_blank" rel="noreferrer" href={`https://wa.me/${String(o.whatsapp||"").replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${o.nombre}, te contacto por tu pedido ${o.order_code} de MDC.`)}`}>WhatsApp</a><select className="field" style={{width:155}} value={o.status||"pendiente"} onChange={e=>void updateStatus(o,e.target.value)}><option value="pendiente">Pendiente</option><option value="confirmado">Confirmado</option><option value="en preparación">En preparación</option><option value="enviado">Enviado</option><option value="completado">Completado</option><option value="cancelado">Cancelado</option></select></div></div></article>)}</div>}</section></main>
}