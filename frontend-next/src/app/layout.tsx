import React from "react";

import type { Metadata } from "next";
import { validateFrontendEnvOnBoot } from "../config/env";
import { loadFonts, type LoadedFonts } from "../lib/fonts";
import "./globals.css";
import "../styles/tokens.css";
import Header from "../../components/Header";

validateFrontendEnvOnBoot();

const composeBodyClassName = (fonts: LoadedFonts): string =>
  [fonts.sans.className, fonts.sans.variable, fonts.mono.className, fonts.mono.variable]
    .filter(Boolean)
    .join(" ");

export const metadata: Metadata = {
  title: "Posts App - Share Your Thoughts",
  description:
    "A modern platform for creating and sharing posts. Sign in to start publishing your content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fonts = loadFonts();
  const bodyClassName = composeBodyClassName(fonts);

  return (
    <html lang="en">
      <body className={bodyClassName}>
        {fonts.styles ? (
          <style data-font-offline dangerouslySetInnerHTML={{ __html: fonts.styles }} />
        ) : null}
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
