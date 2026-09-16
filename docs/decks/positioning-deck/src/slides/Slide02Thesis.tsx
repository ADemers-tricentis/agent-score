import { Slide } from "../components/Slide";
import { brand, surface } from "../theme/theme";

export const Slide02Thesis: React.FC = () => (
  <Slide index={2} kicker="Thesis" dark accentColor={brand.orange}>
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 48,
        maxWidth: 1560,
      }}
    >
      <h1
        style={{
          fontSize: 84,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: -1.5,
          color: surface.textOnDark,
          margin: 0,
        }}
      >
        We are the <span style={{ color: brand.orange }}>verdict layer</span> competitors aren't building.
      </h1>
      <p
        style={{
          fontSize: 30,
          fontWeight: 500,
          lineHeight: 1.5,
          color: surface.textOnDarkSecondary,
          margin: 0,
          maxWidth: 1300,
        }}
      >
        Zero-setup automatic grading - no SDK, no test authoring, no labeled data required.
        <br />
        <span style={{ color: surface.textOnDark, fontWeight: 700 }}>OTel-in, one defensible 0-100 score out.</span>
      </p>
    </div>
  </Slide>
);
