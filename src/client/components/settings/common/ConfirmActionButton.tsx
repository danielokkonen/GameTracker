import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  SvgIconTypeMap,
  Typography,
} from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";

interface ConfirmActionButtonProps {
  label: string;
  icon: OverridableComponent<SvgIconTypeMap<object, "svg">>;
  dialogTitle: string;
  dialogBody: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const ConfirmActionButton = ({
  label,
  icon: Icon,
  dialogTitle,
  dialogBody,
  confirmLabel,
  onConfirm,
}: ConfirmActionButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        color="error"
        startIcon={<Icon />}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Typography>{dialogBody}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConfirmActionButton;
