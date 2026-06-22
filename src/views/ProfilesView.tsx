import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import SvgIcon from "@mui/material/SvgIcon";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import type { View, ScoringProfile, ProfileVersion } from "../types";
import { PROFILES } from "../data/mock";
import TypeTag from "../components/TypeTag";

interface Props {
  navigate: (v: View) => void;
}

function AddIcon() {
  return <SvgIcon fontSize="small"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></SvgIcon>;
}

function LayersIcon() {
  return (
    <SvgIcon sx={{ fontSize: 40, color: "text.disabled" }}>
      <path d="m11.99 18.54-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z" />
    </SvgIcon>
  );
}

function latestVersion(profile: ScoringProfile): ProfileVersion {
  return profile.versions.reduce((max, v) => (v.version > max.version ? v : max), profile.versions[0]);
}

export default function ProfilesView({ navigate }: Props) {
  const profiles = PROFILES;
  const [clonedId, setClonedId] = useState<string | null>(null);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Scoring Profiles</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
            Versioned, dimension-weighted eval bundles. Agents adopt a profile version to define how they're scored.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate({ name: "add-profile" })}
        >
          New profile
        </Button>
      </Box>

      {profiles.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, borderRadius: 2 }}
        >
          <LayersIcon />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>No profiles yet</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Create a profile to bundle evals for an agent type.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate({ name: "add-profile" })}
            sx={{ mt: 1 }}
          >
            New profile
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: "32%" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Evals</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Dimensions</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.map((profile) => {
                const latest = latestVersion(profile);
                const enabledEntries = latest.entries.filter((e) => e.enabled);
                const dimensions = [...new Set(enabledEntries.map((e) => e.dimension))];

                return (
                  <TableRow
                    key={profile.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate({ name: "profile", profileId: profile.id })}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {profile.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", fontFamily: "monospace" }}
                      >
                        {profile.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TypeTag type={profile.agentType} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                          v{latest.version}
                        </Typography>
                        {profile.versions.length > 1 && (
                          <Chip
                            label={`${profile.versions.length} versions`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: "0.62rem" }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {enabledEntries.length}
                        {enabledEntries.length < latest.entries.length && (
                          <Typography component="span" variant="caption" sx={{ color: "text.disabled", ml: 0.5 }}>
                            /{latest.entries.length}
                          </Typography>
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {dimensions.map((d) => (
                          <Chip
                            key={d}
                            label={d}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.65rem" }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <ChipStatus status={profile.status === "active" ? "Passed" : "Failed"} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        sx={{ fontSize: "0.68rem", color: clonedId === profile.id ? "success.main" : "text.secondary", minWidth: 64 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setClonedId(profile.id);
                          setTimeout(() => setClonedId(null), 2000);
                        }}
                      >
                        {clonedId === profile.id ? "Cloned!" : "Clone"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
