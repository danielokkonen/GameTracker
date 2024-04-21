import { Autocomplete, Box, Button, TextField } from "@mui/material";
import React, { useContext, useEffect, useRef } from "react";
import GameDto from "../../../backend/dtos/game-dto";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton } from "@mui/lab";
import { useFormik } from "formik";
import { ObjectSchema, date, number, object, string } from "yup";
import SettingsContext from "../../../client/context/SettingsContext";
import dayjs from "dayjs";

interface CreateGameFormProps {
  value: GameDto;
  onSubmit: any;
  onClose: any;
  franchises?: string[];
}

const CreateGameForm = ({
  value,
  onSubmit,
  onClose,
  franchises,
}: CreateGameFormProps) => {
  const { state } = useContext(SettingsContext);

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleSubmit = (values: GameDto) => {
    onSubmit(values);
  };

  const schema: ObjectSchema<GameDto> = object({
    id: number().optional(),
    name: string().required(),
    franchise: string().required(),
    status: string().optional(),
    started: date().optional().nullable(),
    completed: date().optional().nullable(),
    created: date().optional(),
    updated: date().optional().nullable(),
  });

  const formik = useFormik({
    initialValues: value ?? new GameDto(0, "", ""),
    onSubmit: handleSubmit,
    validationSchema: schema,
  });

  return (
    <Box
      component="form"
      ref={ref}
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        scrollMarginTop: "100px",
        "> div": { marginTop: theme.spacing(2) },
      })}
      onSubmit={formik.handleSubmit}
    >
      <TextField
        name="name"
        label="Name"
        value={formik.values.name}
        onChange={formik.handleChange}
        helperText={formik.touched.name && formik.errors.name}
        error={formik.touched.name && !!formik.errors.name}
      />
      <Autocomplete
        disablePortal
        options={franchises}
        value={formik.values.franchise}
        freeSolo
        renderInput={(params) => (
          <TextField
            {...params}
            name="franchise"
            label="Franchise"
            onChange={formik.handleChange}
            helperText={formik.touched.franchise && formik.errors.franchise}
            error={formik.touched.franchise && !!formik.errors.franchise}
          />
        )}
      />
      <TextField
        type="date"
        name="started"
        label="Started"
        value={
          formik.values.started
            ? dayjs(formik.values.started).format("YYYY-MM-DD")
            : " "
        }
        onChange={formik.handleChange}
        helperText={formik.touched.started && <>{formik.errors.started}</>}
        error={formik.touched.started && !!formik.errors.started}
      />
      <TextField
        type="date"
        name="completed"
        label="Completed"
        value={
          formik.values.completed
            ? dayjs(formik.values.completed).format("YYYY-MM-DD")
            : " "
        }
        onChange={formik.handleChange}
        helperText={formik.touched.completed && <>{formik.errors.completed}</>}
        error={formik.touched.completed && !!formik.errors.completed}
      />
      <Box
        sx={(theme) => ({
          display: "flex",
          justifyContent: "flex-end",
          marginTop: theme.spacing(2),
          ".MuiButton-root": {
            marginLeft: theme.spacing(2),
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
          loading={formik.isSubmitting}
        >
          Submit
        </LoadingButton>
      </Box>
      {state.developerMode && (
        <Box component="pre" sx={{}}>
          {JSON.stringify(formik, null, 2)}
        </Box>
      )}
    </Box>
  );
};

export default CreateGameForm;
