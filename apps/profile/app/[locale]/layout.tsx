import "@govie-ds/theme-govie/theme.css";
import "@govie-ds/react/styles.css";

import styles from "./layout.module.scss";
import { Container, Footer, Header, PhaseBanner } from "@govie-ds/react";
import PageMenu, { PageMenuItem } from "../components/PageMenu";
import { redirect } from "next/navigation";
import { AuthenticationFactory } from "../utils/authentication-factory";
import { Metadata } from "next";
import favicon from "../../public/favicon.ico"
import { LANG_EN, LANG_GA } from "../utils/locale";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

export function generateMetadata(): Metadata {
  const m: Metadata = {
    icons: favicon.src,
  }

  return m
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const tHome = await getTranslations("Home")

  let userName = ""
  let userId = ""

  const oppositeLanguage = locale === LANG_EN ? LANG_GA : LANG_EN
  const path = headers().get("x-pathname")

  const languageToggleUrl = new URL(
    `${process.env.NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT}${path ? `${path.replace(/(\/en|\/ga)/, `/${oppositeLanguage}`)}` : ""}`,
  )

  languageToggleUrl.search = headers().get("x-search") || ""

  const oppositeLanguageLabel =
    locale === LANG_EN
      ? tHome("gaeilgeMenuLabel")
      : tHome("englishMenuLabel")

  const languages = [
    { href: languageToggleUrl.href, label: oppositeLanguageLabel },
  ]

  try {
    const { name, id } = await AuthenticationFactory.getInstance().getUser()
    userName = name || "User"
    userId = id
  } catch (err) {
    redirect("/login")
  }

  return (
    <html lang={locale}>
      <body
        className={styles.body}
      >
        <Header title={tHome("profile")} languages={languages} />
        <main className={styles.main}>
          <Container>
            <PhaseBanner level="beta">
              {tHome.rich("bannerText", {
                url: (chunks) => (
                  <a className='govie-link' href={"/"}>
                    {chunks}
                  </a>
                ),
              })}</PhaseBanner>
            <div className={styles.content_wrapper}>
              <PageMenu userName={userName} topItems={[
                <PageMenuItem href="/messaging" icon="mail">{tHome("messaging")}</PageMenuItem>,
                <PageMenuItem href="/" icon="person" isSelected>{tHome("profile")}</PageMenuItem>,
                <PageMenuItem href="/notification-preferences" icon="candlestick_chart">{tHome("notificationPreferences")}</PageMenuItem>
              ]} />
              <div className={[styles.flex_1, styles.flex_col, styles.gap_2].join(" ")}>
                {children}
              </div>
            </div>
          </Container>
        </main>
        <Footer />
      </body>
    </html>
  );
}
