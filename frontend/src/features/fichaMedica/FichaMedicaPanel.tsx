import { useState } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { useFichaMedica } from '../../hooks/useFichaMedica';
import { FichaMedicaResumen } from './FichaMedicaResumen';
import { FichaMedicaForm } from './FichaMedicaForm';

interface FichaMedicaPanelProps {
  miembroId?: string;
  miembroNombre?: string;
}

export const FichaMedicaPanel = ({ miembroId, miembroNombre }: FichaMedicaPanelProps) => {
  const canViewMedico = usePermission('medico:view');
  const canEditMedico = usePermission('medico:edit');
  const canUpdateMedico = usePermission('medico:update');
  const canEdit = canEditMedico || canUpdateMedico;
  const { ficha, loading, reload } = useFichaMedica(miembroId || '');
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!miembroId) return null;
  if (!canViewMedico) return null;

  return (
    <>
      <FichaMedicaResumen
        ficha={ficha}
        canEdit={canEdit}
        loading={loading}
        onEdit={() => setDialogOpen(true)}
      />
      <FichaMedicaForm
        open={dialogOpen}
        miembroId={miembroId}
        miembroNombre={miembroNombre || ''}
        ficha={ficha}
        onClose={() => setDialogOpen(false)}
        onSaved={reload}
      />
    </>
  );
};
