# Skill: Create Form

Genera un formulario con React Hook Form y Zod.

## Descripción

Esta skill crea automáticamente un formulario completo con:
- Validaciones usando Zod schema
- Integración con React Hook Form
- Estilos con Material UI
- Manejo de errores
- Tipos TypeScript

## Uso

```
/create-form [nombre-formulario] [campos:tipo]
```

## Parámetros

- `nombre-formulario`: Nombre del formulario (ej: LoginForm, JovenForm)
- `campos:tipo`: Campo y tipo separados por dos puntos, separados por coma

## Tipos Soportados

| Tipo | Descripción |
|------|-------------|
| string | Texto básico |
| email | Email con validación |
| password | Contraseña |
| number | Número |
| boolean | Checkbox |
| date | Fecha |
| select | Dropdown (requiere opciones) |
| textarea | Texto largo |
| tel | Teléfono |

## Ejemplos

```
/create-form LoginForm email:email,password:password
/create-form JovenForm nombre:string,email:email,fechaNacimiento:date,unidad:select
/create-form UserForm nombre:string,email:email,rol:select
```

## Estructura Generada

```tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box } from '@mui/material';

const schema = z.object({
  // campos generados
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: FormData) => void;
  initialData?: FormData;
}

export const Form = ({ onSubmit, initialData }: Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {/* campos generados */}
      <Button type="submit">Enviar</Button>
    </Box>
  );
};
```

## Reglas

- Usar Zod para validaciones
- Incluir mensajes de error personalizados
- Usar MUI TextField para inputs
- Manejar estado de carga
- Soportar datos iniciales (edición)
