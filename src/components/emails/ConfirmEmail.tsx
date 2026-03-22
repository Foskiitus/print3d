import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Section,
  Heading,
} from "@react-email/components";

interface ConfirmEmailProps {
  confirmLink: string;
  locale: string;
}

export const ConfirmEmail = ({ confirmLink, locale }: ConfirmEmailProps) => {
  const isPt = locale === "pt";

  return (
    <Html>
      <Head />
      <Preview>{isPt ? "Confirma o teu email" : "Confirm your email"}</Preview>
      <Body style={{ backgroundColor: "#f0f6ff", padding: "40px 0" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e0f2fe",
            borderRadius: "8px",
            padding: "40px",
          }}
        >
          <Heading style={{ color: "#0284c7", fontSize: "24px" }}>
            SpoolIQ
          </Heading>
          <Text>
            {isPt
              ? "Bem-vindo! Clica abaixo para confirmar a tua conta:"
              : "Welcome! Click below to confirm your account:"}
          </Text>
          <Section style={{ textAlign: "center", margin: "30px 0" }}>
            <Link
              href={confirmLink}
              style={{
                backgroundColor: "#0284c7",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              {isPt ? "Confirmar Email" : "Confirm Email"}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
