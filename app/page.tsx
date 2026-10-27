"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Bell, UserRound, ShoppingCart, X, PackageCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";

type Product={id:string;nombre:string|null;name?:string;precio:number|null;price?:number;imagen:string|null;image?:string;categoria:string|null;category?:string;stock:number|null;is_best_seller:boolean|null;is_active:boolean|null};
type CartItem={product:Product;qty:number};
const money=(n:number)=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:2}).format(n);
const pname=(p:Product)=>p.nombre||p.name||"Producto";
const pprice=(p:Product)=>Number(p.precio??p.price??0);
const pimage=(p:Product)=>p.imagen||p.image||"https://placehold.co/600x400/171717/eeeeee?text=MDC";
const pcat=(p:Product)=>p.categoria||p.category||"Otros";

export default function Home(){
 const [products,setProducts]=useState<Product[]>([]),[cart,setCart]=useState<CartItem[]>([]),[category,setCategory]=useState("Todos"),[search,setSearch]=useState(""),[showCart,setShowCart]=useState(false),[showCheckout,setShowCheckout]=useState(false),[notice,setNotice]=useState(""),[name,setName]=useState(""),[phone,setPhone]=useState(""),[busy,setBusy]=useState(false);
 const supabase=useMemo(()=>supabaseBrowser(),[]);
 
 useEffect(()=>{try{setCart(JSON.parse(localStorage.getItem("mdc-cart")||"[]"))}catch{}; void load();},[]);
 useEffect(()=>{localStorage.setItem("mdc-cart",JSON.stringify(cart))},[cart]);
 
 async function load(){const {data,error}=await supabase.from("products").select("*").eq("is_active",true).order("created_at",{ascending:false});if(error){setNotice("No se pudieron cargar productos: "+error.message);return}setProducts((data||[]) as Product[])}
 const cats=["Todos",...Array.from(new Set(products.map(pcat).filter(Boolean)))];
 const filtered=products.filter(p=>(category==="Todos"||pcat(p)===category)&&pname(p).toLowerCase().includes(search.toLowerCase()));
 const total=cart.reduce((s,i)=>s+pprice(i.product)*i.qty,0),count=cart.reduce((s,i)=>s+i.qty,0);
 function add(p:Product){setCart(old=>{const hit=old.find(i=>i.product.id===p.id);return hit?old.map(i=>i.product.id===p.id?{...i,qty:i.qty+1}:i):[...old,{product:p,qty:1}]});setNotice("Agregado al carrito")}
 function qty(id:string,delta:number){setCart(old=>old.map(i=>i.product.id===id?{...i,qty:i.qty+delta}:i).filter(i=>i.qty>0))}

 // FIX: Ya no usa prompt()
 async function checkout(e:React.FormEvent){
   e.preventDefault();
   if(!cart.length) return;
   if(!name || !phone){setNotice("Completá nombre y WhatsApp");return}
   setBusy(true);
   try{
     const code="MDC-"+Math.random().toString(36).slice(2,6).toUpperCase();
     const payload=cart.map(i=>({id:i.product.id,nombre:pname(i.product),precio:pprice(i.product),cantidad:i.qty,imagen:pimage(i.product)}));
     const {error}=await supabase.from("orders").insert({
       order_code:code,
       nombre:name,
       whatsapp:phone,
       productos:payload,
       total,
       status:"pendiente"
     });
     if(error) throw error;
     setCart([]);setShowCheckout(false);setShowCart(false);
     setNotice("¡Pedido guardado! Código: "+code+" - Te hablamos al WhatsApp.");
   }catch(err:any){
     setNotice("No se pudo guardar el pedido: "+(err?.message||"error"))
   }finally{setBusy(false)}
 }

 return <><header className="topbar"><div className="wrap" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,paddingTop:12,paddingBottom:12}}><a href="/" style={{fontSize:26,fontWeight:900,letterSpacing:2,color:"white",textDecoration:"none"}}>MDC<span style={{color:"#999"}}>.</span></a><div style={{display:"flex",gap:4,alignItems:"center"}}><button className="iconbtn" title="Buscar" onClick={()=>document.getElementById("search")?.focus()}><Search/></button><button className="iconbtn" title="Notificaciones" onClick={()=>setNotice("No tenés notificaciones nuevas.")}><Bell/></button><button className="iconbtn" title="Info" onClick={()=>setNotice("MDC Store - Compra sin registro, solo nombre y WhatsApp")}><UserRound/></button><button className="iconbtn" title="Carrito" onClick={()=>setShowCart(true)}><ShoppingCart/><span style={{fontSize:12,marginLeft:4}}>{count}</span></button></div></div></header>
 <main className="wrap"><section style={{padding:"30px 0 28px"}}><div className="muted" style={{letterSpacing:3,fontSize:12}}>SELECCIÓN MDC</div><h1 style={{fontSize:"clamp(34px,6vw,64px)",lineHeight:1.02,margin:"12px 0",maxWidth:720}}>Lo que buscás.<br/><span style={{color:"#9ca3af"}}>En un solo lugar.</span></h1><p className="muted" style={{maxWidth:540}}>Productos seleccionados, compra simple y atención directa.</p></section>
 {products.some(p=>p.is_best_seller)&&<section style={{marginBottom:34}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"end",marginBottom:14}}><div><div className="muted" style={{fontSize:12}}>LOS FAVORITOS</div><h2 style={{fontSize:26,margin:"5px 0"}}>Más vendidos</h2></div><PackageCheck color="#aaa"/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:14}}>{products.filter(p=>p.is_best_seller).slice(0,4).map(p=><article className="panel" key={p.id}><img className="product-img" src={pimage(p)} alt={pname(p)}/><p className="muted" style={{fontSize:12}}>{pcat(p)}</p><h3>{pname(p)}</h3><div className="price">{money(pprice(p))}</div><button className="btn" style={{width:"100%",marginTop:14}} onClick={()=>add(p)}>Agregar al carrito</button></article>)}</div></section>}
 <section><div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"end",flexWrap:"wrap",marginBottom:18}}><div><div className="muted" style={{fontSize:12}}>CATÁLOGO</div><h2 style={{fontSize:28,margin:"5px 0"}}>Todos los productos</h2></div><input id="search" className="field" style={{maxWidth:300}} placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>{cats.map(c=><button key={c} className={"pill "+(category===c?"active":"")} onClick={()=>setCategory(c)}>{c}</button>)}</div>{filtered.length?<div className="product-grid">{filtered.map(p=><article className="panel" key={p.id}><img className="product-img" src={pimage(p)} alt={pname(p)}/><p className="muted" style={{fontSize:12}}>{pcat(p)} · Stock {p.stock??0}</p><h3 style={{margin:"8px 0"}}>{pname(p)}</h3><div className="price">{money(pprice(p))}</div><button className="btn" style={{width:"100%",marginTop:14}} disabled={(p.stock??0)<=0} onClick={()=>add(p)}>Agregar al carrito</button></article>)}</div>:<div className="panel muted">{products.length?"No hay resultados para ese filtro.":"Todavía no hay productos publicados. Cargá productos desde /admin."}</div>}</section>
 <footer className="muted" style={{padding:"50px 0 20px",fontSize:13}}>© {new Date().getFullYear()} MDC Store · <a href="/admin" style={{color:"#aaa"}}>Administración</a></footer></main>
 {notice&&<div style={{position:"fixed",bottom:18,left:"50%",transform:"translateX(-50%)",zIndex:20,background:"#f5f5f5",color:"#111",padding:"12px 18px",borderRadius:12,boxShadow:"0 8px 35px #0008",maxWidth:"90vw"}}>{notice}<button onClick={()=>setNotice("")} style={{marginLeft:12,border:0,background:"transparent"}}>×</button></div>}
 {showCart&&<div style={overlay} onClick={()=>setShowCart(false)}><div className="panel" style={drawer} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2>Tu carrito ({count})</h2><button className="iconbtn" onClick={()=>setShowCart(false)}><X/></button></div>{cart.length?cart.map(i=><div key={i.product.id} style={{display:"flex",gap:12,padding:"14px 0",borderBottom:"1px solid #333"}}><img src={pimage(i.product)} alt="" style={{width:72,height:72,objectFit:"cover",borderRadius:8}}/><div style={{flex:1}}><b>{pname(i.product)}</b><div>{money(pprice(i.product))}</div><div style={{display:"flex",gap:10,alignItems:"center",marginTop:8}}><button className="pill" onClick={()=>qty(i.product.id,-1)}>−</button>{i.qty}<button className="pill" onClick={()=>qty(i.product.id,1)}>+</button></div></div></div>):<p className="muted">Tu carrito está vacío.</p>}<h3>Total: {money(total)}</h3><button className="btn" style={{width:"100%"}} disabled={!cart.length} onClick={()=>{setShowCheckout(true);setShowCart(false)}}>Continuar al checkout</button></div></div>}
 {showCheckout&&<div style={overlay} onClick={()=>setShowCheckout(false)}><form className="panel" style={{...drawer,maxWidth:480}} onClick={e=>e.stopPropagation()} onSubmit={checkout}><div style={{display:"flex",justifyContent:"space-between"}}><h2>Finalizar pedido</h2><button type="button" className="iconbtn" onClick={()=>setShowCheckout(false)}><X/></button></div><p className="muted">Total del pedido: {money(total)}</p><label>Nombre completo<input required className="field" style={{margin:"7px 0 15px"}} value={name} onChange={e=>setName(e.target.value)}/></label><label>WhatsApp<input required className="field" style={{margin:"7px 0 15px"}} placeholder="Ej. 549336..." value={phone} onChange={e=>setPhone(e.target.value)}/></label><button className="btn" style={{width:"100%"}} disabled={busy}>{busy?"Guardando...":"Confirmar pedido"}</button></form></div>}
 </>;
}
const overlay:React.CSSProperties={position:"fixed",inset:0,background:"#000b",zIndex:10,display:"flex",justifyContent:"flex-end"};
const drawer:React.CSSProperties={width:"min(100%,460px)",height:"100%",overflowY:"auto",borderRadius:0,padding:24};