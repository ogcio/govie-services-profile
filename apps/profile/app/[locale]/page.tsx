import { Metadata } from "next";
import { NextPageProps, ApiProfileUser } from "../../types";
import { getMessages, getTranslations } from "next-intl/server";
import { Button, Heading, SummaryList, SummaryListRow, SummaryListValue, TextInput } from "@govie-ds/react";
import styles from "./layout.module.scss"
import Link from "next/link";
import { AuthenticationFactory } from "../utils/authentication-factory";
import { getDayMonthYear, stringToAsterisk } from "../utils";
import PublicNameForm from "../components/PublicNameForm/PublicNameForm";
import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";

export async function generateMetadata(props: {
  params: { locale: string; slug: string }
}): Promise<Metadata> {
  const tTitle = await getTranslations("Metadata")
  const m: Metadata = {
    title: tTitle("profileTitle"),
  }

  return m
}

export default async function RootPage(props: NextPageProps) {
  const tProfile = await getTranslations("Profile")

  const profileUser: ApiProfileUser = {
    details: {
      address: undefined,
      city: undefined,
      dateOfBirth: undefined,
      email: "",
      firstName: "",
      lastName: "",
      phone: undefined
    },
    id: "",
    primaryUserId: "",
    publicName: "",
    createdAt: "",
    preferredLanguage: "en",
    safeLevel: 0,
    updatedAt: "",
    email: ""
  }

  let userId = ""
  try {
    const { id } = await AuthenticationFactory.getInstance().getUser()
    userId = id

    const res = await fetch(
      new URL(
        "/api/token",
        process.env.NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT as string,
      ),
      { headers: { cookie: headers().get("cookie")! } }
    );
    const { token } = await res.json();
    console.log({ token })
    const hahaha = await fetch(`http://localhost:8003/api/v1/profiles/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const hahajson = await hahaha.json()

    Object.assign(profileUser, hahajson.data)

  } catch (err) {
    console.log(err)
  }

  const { day, month, year } = getDayMonthYear(profileUser.details?.dateOfBirth || "")

  return (
    <>
      <Heading as="h1" size="xl">{tProfile("profile")}</Heading>
      <Heading as="h2" size="md">{tProfile("publicName")}</Heading>
      <NextIntlClientProvider messages={await getMessages()}>
        <PublicNameForm profileUser={profileUser} userId={userId} />
      </NextIntlClientProvider>
      <Heading as="h2" size="md">{tProfile("name")}</Heading>
      <SummaryList>
        <SummaryListRow
          withBorder
          label={tProfile("firstName")}
        >
          <SummaryListValue>
            {profileUser.details?.firstName}
          </SummaryListValue>
        </SummaryListRow>
        <SummaryListRow
          withBorder
          label={tProfile("lastName")}
        >
          <SummaryListValue>
            {profileUser.details?.lastName}
          </SummaryListValue>
        </SummaryListRow>
      </SummaryList>

      <Heading as="h2" size="md">{tProfile("dateOfBirth")}</Heading>
      <SummaryList>
        <SummaryListRow
          withBorder
          label={tProfile("day")}
        >
          <SummaryListValue>
            {day}
          </SummaryListValue>
        </SummaryListRow>
        <SummaryListRow
          withBorder
          label={tProfile("month")}
        >
          <SummaryListValue>
            {month}
          </SummaryListValue>
        </SummaryListRow>
        <SummaryListRow
          withBorder
          label={tProfile("year")}
        >
          <SummaryListValue>
            {year}
          </SummaryListValue>
        </SummaryListRow>
      </SummaryList>

      <Heading as="h2" size="md">PPSN</Heading>
      <SummaryList>
        <SummaryListRow
          withBorder
          label="PPSN"
        >
          <SummaryListValue>
            {/* {props.searchParams?.ppsn === "1" ? "{profileUser.details.ppsn.value}" : stringToAsterisk("ppsn")} */}
            {null}
          </SummaryListValue>
          <dd className="gi-summary-list-actions">
            {/* {true ?
              props.searchParams?.ppsn === "1" ?
                <Link href={"?ppsn="} className="gi-link">{tProfile("clickToHide")}</Link> :
                <Link href={"?ppsn=1"} className="gi-link">{tProfile("clickToReveal")}</Link>
              : null} */}
          </dd>
        </SummaryListRow>
      </SummaryList>

      <Heading as="h2" size="md">{tProfile("gender")}</Heading>
      <SummaryList>
        <SummaryListRow
          withBorder
          label={tProfile("gender")}
        >
          <SummaryListValue>
            {null}
          </SummaryListValue>
        </SummaryListRow>
      </SummaryList>

      <Heading as="h2" size="md">{tProfile("contactDetails")}</Heading>
      <SummaryList>
        <SummaryListRow
          withBorder
          label={tProfile("phone")}
        >
          <SummaryListValue>
            {profileUser.details?.phone}
          </SummaryListValue>
        </SummaryListRow>
        <SummaryListRow
          withBorder
          label={tProfile("email")}
        >
          <SummaryListValue>
            {profileUser.email}
          </SummaryListValue>
        </SummaryListRow>
      </SummaryList>
    </>
  )
};
