# MDC Store — Next.js 14 + Tailwind + Supabase

## Incluye
- Catálogo público, búsqueda, categorías y más vendidos.
- Carrito guardado en `localStorage`.
- Checkout con nombre y WhatsApp, código MDC-XXXX y escritura en `orders` y `profiles`.
- Panel `/admin` con control por `profiles.role = 'admin'`, pedidos, enlaces a WhatsApp y CRUD de productos con imágenes en Storage.
- Usa la estructura de productos existente y agrega campos MDC compatibles para no borrar columnas/relaciones de la tienda ya existente.

## Instalación
1. Copiá `.env.local.example` a `.env.local`.
2. En `.env.local`, completá `NEXT_PUBLIC_SUPABASE_ANON_KEY` con la publishable key/anon key del proyecto. Nunca pongas una `service_role` key en el navegador.
3. En la carpeta del proyecto:
   ```bash
   npm install
   npm run dev
   ```
4. Abrí http://localhost:3000

## Dar acceso de administrador
El perfil que ya existía en el proyecto tiene rol `customer`; no se cambió automáticamente. Confirmá que la cuenta sea tuya antes de elevarla a administrador. Para asignar el rol a tu usuario desde SQL Editor, usá:
```sql
update public.profiles
set role = 'admin'
where id = 'TU_AUTH_USER_UUID';
```
Obtené tu UUID en Authentication > Users. No habilites admin por email enviado desde el navegador.

## Seguridad y comportamiento
- Lectura pública solo de productos activos.
- Escritura/CRUD de productos e imágenes solo para `profiles.role = 'admin'`.
- Perfiles privados por usuario; pedidos visibles para su dueño y admins.
- Checkout requiere sesión iniciada porque la policy de pedidos limita la inserción a `auth.uid()`.
- Las policies del Storage limitan carga/edición/borrado a admins; lectura pública del bucket `products`.
- No se agregó una service-role key ni se expuso ningún secreto.
- Si el proyecto tenía un `orders` con columnas preexistentes, la migración añadió los campos faltantes y conservó sus relaciones/datos.
