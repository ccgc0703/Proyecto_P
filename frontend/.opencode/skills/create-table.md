# Skill: Create Table

Genera una tabla con filtros y paginación usando Material UI.

## Descripción

Esta skill crea automáticamente una tabla completa con:
- MUI DataGrid o Table
- Paginación
- Filtros por columnas
- Búsqueda global
- Ordenamiento
- Acciones por fila (editar, eliminar)
- Loading state

## Uso

```
/create-table [nombre-tabla] [columnas]
```

## Parámetros

- `nombre-tabla`: Nombre de la tabla (ej: JovenesTable, UsuariosTable)
- `columnas`: Columnas separadas por coma con formato nombre:tipo

## Tipos de Columna

| Tipo | Render |
|------|--------|
| string | Texto normal |
| number | Número |
| date | Fecha formateada |
| boolean | Chip (Sí/No) |
| actions | Botones de acción |
| select | Badge con label |

## Ejemplos

```
/create-table JovenesTable nombre,apellido,fechaNacimiento:date,unidad:select,estado:boolean
/create-table UsuariosTable nombre,email,rol:select,estado:boolean,acciones:actions
```

## Estructura Generada

```tsx
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, TextField, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Props {
  data: any[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const Table = ({ data, loading, onEdit, onDelete }: Props) => {
  const columns: GridColDef[] = [
    // columnas generadas
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        pagination
        pageSizeOptions={[10, 25, 50]}
      />
    </Box>
  );
};
```

## Reglas

- Usar MUI DataGrid para mejor rendimiento
- Incluir search/filter input
- Mostrar acciones solo si el usuario tiene permisos
- Aplicar filtro por unidad según rol
- Manejar estado vacío (no data)
- UsarSkeleton durante carga
