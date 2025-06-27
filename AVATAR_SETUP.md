# Avatar Upload Setup

Para que la funcionalidad de carga de avatares funcione correctamente, necesitas configurar el almacenamiento en Supabase.

## 1. Configurar el bucket de avatares

Ejecuta el siguiente SQL en el **SQL Editor** de Supabase:

```sql
-- Simple storage setup for avatars
-- Run this in Supabase SQL Editor

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view avatars" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to update avatars" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow authenticated users to delete avatars" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow public to view avatars" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
```

## 2. Verificar la configuración

1. Ve a **Storage** en el dashboard de Supabase
2. Deberías ver un bucket llamado "avatars"
3. El bucket debe estar marcado como público
4. Los usuarios autenticados deben poder subir archivos

## 3. Funcionalidades

- **Carga de imágenes**: Los usuarios pueden subir imágenes desde su galería
- **Previsualización**: Se muestra una vista previa antes de subir
- **Validación**: Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP) hasta 5MB
- **Dos opciones**: Los usuarios pueden subir una imagen o usar una URL
- **Actualización automática**: El avatar se actualiza automáticamente después de la carga

## 4. Uso

1. Ve a tu perfil
2. En la sección "Upload Image", haz clic en "Choose Image"
3. Selecciona una imagen de tu galería
4. Haz clic en "Upload Avatar"
5. La imagen se subirá y se actualizará automáticamente

## 5. Solución de problemas

### Error: "new row violates row-level security policy"

Si ves este error, significa que las políticas de almacenamiento no están configuradas correctamente:

1. **Ejecuta el SQL de configuración** en el SQL Editor de Supabase
2. **Verifica que el bucket existe** en Storage
3. **Revisa las políticas** en la pestaña "Policies" del bucket

### Otros problemas comunes:

1. **Bucket no existe**: Ejecuta el SQL de configuración
2. **Políticas incorrectas**: Elimina y recrea las políticas
3. **Archivo muy grande**: Asegúrate de que sea menor a 5MB
4. **Tipo de archivo no soportado**: Solo JPG, PNG, GIF, WebP

### Debug:

Revisa la consola del navegador para ver logs detallados:
- Información del archivo
- Buckets disponibles
- Respuesta de la subida
- Errores específicos 