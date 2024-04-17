import { Box, Button, TextField } from "@mui/material";
import React from "react";
import GameDto from "../../../backend/dtos/game-dto";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton } from "@mui/lab";

interface CreateGameFormProps {
  value: GameDto;
  onSubmit: any;
  onChange: any;
  onClose: any;
  loading: boolean;
}

const CreateGameForm = ({
  value: values,
  onSubmit,
  onChange,
  onClose,
  loading,
}: CreateGameFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Box
      component="form"
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        ".MuiInputBase-root > *": { marginBottom: theme.spacing(1) },
      })}
      onSubmit={handleSubmit}
    >
      <TextField
        name="name"
        label="Name"
        value={values.name}
        onChange={onChange}
      />
      <TextField
        name="franchise"
        label="Franchise"
        value={values.franchise}
        onChange={onChange}
      />
      <TextField
        name="status"
        label="Status"
        value={values.status}
        onChange={onChange}
      />
      <TextField
        name="started"
        label="Started"
        value={values.started}
        onChange={onChange}
      />
      <TextField
        name="end"
        label="Completed"
        value={values.completed}
        onChange={onChange}
      />
      <Box
        sx={(theme) => ({
          display: "flex",
          justifyContent: "flex-end",
          ".MuiButton-root": {
            marginLeft: theme.spacing(1),
          },
        })}
      >
        <Button variant="text" onClick={onClose}>
          Close
        </Button>
        <LoadingButton
          type="submit"
          variant="contained"
          startIcon={<SaveIcon />}
          loading={loading}
        >
          Submit
        </LoadingButton>
      </Box>
    </Box>
  );
};

export default CreateGameForm;
