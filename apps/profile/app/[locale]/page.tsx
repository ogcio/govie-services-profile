import { Metadata } from "next";
import { NextPageProps, ApiProfileUser } from "../../types";
import { getMessages, getTranslations } from "next-intl/server";
import { Heading, SummaryList, SummaryListRow, SummaryListValue } from "@govie-ds/react";
import Link from "next/link";
import { AuthenticationFactory } from "../utils/authentication-factory";
import { getDayMonthYear, stringToAsterisk } from "../utils";
import PublicNameForm from "../components/PublicNameForm/PublicNameForm";
import { NextIntlClientProvider } from "next-intl";
import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"

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
  const logger = getServerLogger("error")
  const tProfile = await getTranslations("Profile")

  const profileUser: ApiProfileUser = {
    details: {
      preferredLanguage: "en",
      ppsn: undefined,
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

    const profileClient = await AuthenticationFactory.getProfileClient()
    const profile = await profileClient.getProfile(id)

    if (profile.error) {
      throw profile.error
    }

    Object.assign(profileUser, profile.data)

  } catch (error) {
    logger.error(error)
  }

  const { day, month, year } = getDayMonthYear(profileUser.details?.dateOfBirth || "")

  return (
    <>
      <Heading as="h1" size="xl">{tProfile("profile")}</Heading>
      <Heading as="h2" size="md">{tProfile("publicName")}</Heading>
      <NextIntlClientProvider messages={await getMessages()}>
        <PublicNameForm publicName={profileUser.publicName} userId={userId} />
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

      {profileUser.details?.dateOfBirth && <> <Heading as="h2" size="md">{tProfile("dateOfBirth")}</Heading>
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
      </>}

      {profileUser.details?.ppsn && <>
        <Heading as="h2" size="md">PPSN</Heading>
        <SummaryList>
          <SummaryListRow
            withBorder
            label="PPSN"
          >
            <SummaryListValue>
              {props.searchParams?.ppsn === "1" ? profileUser.details.ppsn : stringToAsterisk("ppsn")}
            </SummaryListValue>
            <dd className="gi-summary-list-actions">
              {
                props.searchParams?.ppsn === "1" ?
                  <Link href={"?ppsn="} className="gi-link">{tProfile("clickToHide")}</Link> :
                  <Link href={"?ppsn=1"} className="gi-link">{tProfile("clickToReveal")}</Link>
              }
            </dd>
          </SummaryListRow>
        </SummaryList>
      </>}

      {(profileUser.email || profileUser.details?.phone) && <>
        <Heading as="h2" size="md">{tProfile("contactDetails")}</Heading>
        <SummaryList>
          {profileUser.details?.phone ? <SummaryListRow
            withBorder
            label={tProfile("phone")}
          >
            <SummaryListValue>
              {profileUser.details?.phone}
            </SummaryListValue>
          </SummaryListRow>
            : <></>
          }
          {profileUser.email ? <SummaryListRow
            withBorder
            label={tProfile("email")}
          >
            <SummaryListValue>
              {profileUser.email}
            </SummaryListValue>
          </SummaryListRow> : <></>}
        </SummaryList>
      </>}
    </>
  )
};
