import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { View } from "../types";

interface Props {
  navigate: (v: View) => void;
}

export default function UsersView({ navigate: _navigate }: Props) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Users</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>TODO</Typography>
    </Box>
  );
}
