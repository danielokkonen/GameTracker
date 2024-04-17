import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";
import GameDto from "../../../backend/dtos/game-dto";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

interface GameListProps {
  items: GameDto[];
  onEdit: any;
  onDelete: any;
}

const GameList = ({ items, onEdit, onDelete }: GameListProps) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Franchise</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Started</TableCell>
            <TableCell>Completed</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.name}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.franchise}</TableCell>
              <TableCell>{item.status}</TableCell>
              <TableCell>{item.started?.toLocaleString()}</TableCell>
              <TableCell>{item.completed?.toLocaleString()}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(item)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => onDelete(item.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GameList;
