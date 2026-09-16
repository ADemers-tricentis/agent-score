import { brand, surface } from "../theme/theme";
import { COLUMNS, type CompareRow } from "../data/compareData";

export const CompareTable: React.FC<{ rows: CompareRow[] }> = ({ rows }) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
      fontSize: 15,
    }}
  >
    <colgroup>
      <col style={{ width: "206px" }} />
      {COLUMNS.map((c) => (
        <col key={c} style={{ width: `${(1680 - 206) / COLUMNS.length}px` }} />
      ))}
    </colgroup>
    <thead>
      <tr>
        <th
          style={{
            textAlign: "left",
            padding: "12px 14px",
            background: brand.navyDeep,
            color: surface.textOnDark,
            fontSize: 15,
            fontWeight: 800,
            borderTopLeftRadius: 10,
          }}
        >
          Dimension
        </th>
        {COLUMNS.map((c, i) => (
          <th
            key={c}
            style={{
              textAlign: "left",
              padding: "12px 10px",
              background: c === "AgentScore" ? brand.teal : brand.navyDeep,
              color: surface.textOnDark,
              fontSize: 14.5,
              fontWeight: 800,
              lineHeight: 1.25,
              borderTopRightRadius: i === COLUMNS.length - 1 ? 10 : 0,
            }}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, ri) => (
        <tr key={row.label} style={{ background: ri % 2 === 0 ? surface.raised : brand.bgLight }}>
          <td
            style={{
              padding: "13px 14px",
              fontWeight: 700,
              color: surface.textPrimary,
              lineHeight: 1.3,
              borderBottom: `1px solid ${surface.divider}`,
            }}
          >
            {row.label}
          </td>
          {row.values.map((v, ci) => (
            <td
              key={ci}
              style={{
                padding: "13px 10px",
                color: surface.textPrimary,
                fontWeight: ci === 0 ? 700 : 500,
                lineHeight: 1.3,
                borderBottom: `1px solid ${surface.divider}`,
                background: ci === 0 ? "rgba(0,135,174,0.07)" : "transparent",
              }}
            >
              {v}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
