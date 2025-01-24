
import React from "react"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Page from "./page"

const getProfile = vi.hoisted(vi.fn)
vi.mock("../utils/authentication-factory", () => ({
    AuthenticationFactory: {
        getProfileClient: vi.fn().mockResolvedValue({
            getProfile: getProfile
        }),
        getInstance: vi.fn().mockReturnValue({
            getUser: vi.fn().mockResolvedValue({ id: "123" })
        })
    }
}))

vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn().mockResolvedValue((s: string) => s),
    getMessages: vi.fn()
}))

const loggerErrorSpy = vi.hoisted(vi.fn)
vi.mock("@ogcio/nextjs-logging-wrapper/server-logger", async (impl) => ({
    ...(await impl()),
    getServerLogger: vi.fn().mockImplementation(() => ({
        error: loggerErrorSpy,
    })),
}))

vi.mock("../components/PublicNameForm/PublicNameForm")

describe("profile main page", () => {
    beforeEach(() => {
        getProfile.mockReset()
        loggerErrorSpy.mockReset()
    })

    it("should render all summary lists with all data", async () => {
        getProfile.mockResolvedValueOnce({
            data: {
                details: {
                    preferredLanguage: "en",
                    ppsn: "12345",
                    address: "address 123",
                    city: "Visby",
                    dateOfBirth: "2005-01-24T08:22:43.407Z",
                    email: "skoj@aren",
                    firstName: "Test",
                    lastName: "Testsson",
                    phone: "+4612341234"
                },
                id: "1",
                primaryUserId: "123",
                publicName: "Lasse Kongo",
                createdAt: "2025-01-24T08:22:43.407Z",
                preferredLanguage: "en",
                safeLevel: 0,
                updatedAt: "2025-01-24T08:22:44.407Z",
                email: "skoj@aren2"
            }
        })
        const cmp = await import("../components/PublicNameForm/PublicNameForm")

        await act(async () => {
            const PageComponent = await Page({
                params: { locale: "en" },
            })

            render(PageComponent)
        })

        await waitFor(() => {
            expect(cmp.default).toBeCalledWith({ publicName: "Lasse Kongo", userId: "123" }, {})
            expect(screen.getByRole("heading", { name: "profile" })).toBeInTheDocument()
            expect(screen.getByRole("heading", { name: "publicName" })).toBeInTheDocument()
            expect(screen.getByRole("heading", { name: "name" })).toBeInTheDocument()

            const summaryLists = screen.getAllByLabelText('Summary list')

            const summaryListName = summaryLists[0];
            expect(summaryListName).toBeInTheDocument();

            expect(within(summaryListName).getByText('firstName')).toBeInTheDocument();
            expect(within(summaryListName).getByText('lastName')).toBeInTheDocument();
            expect(within(summaryListName).getByText('Test')).toBeInTheDocument();
            expect(within(summaryListName).getByText('Testsson')).toBeInTheDocument();

            expect(screen.getByRole("heading", { name: "dateOfBirth" })).toBeInTheDocument()
            const summaryListDOB = summaryLists[1];
            expect(summaryListDOB).toBeInTheDocument();
            expect(within(summaryListDOB).getByText('day')).toBeInTheDocument();
            expect(within(summaryListDOB).getByText('24')).toBeInTheDocument();
            expect(within(summaryListDOB).getByText('month')).toBeInTheDocument();
            expect(within(summaryListDOB).getByText('1')).toBeInTheDocument();
            expect(within(summaryListDOB).getByText('year')).toBeInTheDocument();
            expect(within(summaryListDOB).getByText('2005')).toBeInTheDocument();

            expect(screen.getByRole("heading", { name: "PPSN" })).toBeInTheDocument()
            const summaryListPPSN = summaryLists[2];
            expect(summaryListPPSN).toBeInTheDocument();
            expect(within(summaryListPPSN).getByText('PPSN')).toBeInTheDocument();
            expect(within(summaryListPPSN).getByText('****')).toBeInTheDocument();
            expect(within(summaryListPPSN).getByText('clickToReveal')).toBeInTheDocument();

            expect(screen.getByRole("heading", { name: "contactDetails" })).toBeInTheDocument()
            const summaryListDetails = summaryLists[3];
            expect(within(summaryListDetails).getByText('phone')).toBeInTheDocument();
            expect(within(summaryListDetails).getByText('+4612341234')).toBeInTheDocument();
            expect(within(summaryListDetails).getByText('email')).toBeInTheDocument();
            expect(within(summaryListDetails).getByText('skoj@aren2')).toBeInTheDocument();

            expect(loggerErrorSpy).not.toBeCalled()
        })
    })

    it("should reveal ppsn with the appropriate url query parameter is iset", async () => {
        getProfile.mockResolvedValueOnce({
            data: {
                details: {
                    preferredLanguage: "en",
                    ppsn: "12345",
                    address: "address 123",
                    city: "Visby",
                    dateOfBirth: "2005-01-24T08:22:43.407Z",
                    email: "skoj@aren",
                    firstName: "Test",
                    lastName: "Testsson",
                    phone: "+4612341234"
                },
                id: "1",
                primaryUserId: "123",
                publicName: "Lasse Kongo",
                createdAt: "2025-01-24T08:22:43.407Z",
                preferredLanguage: "en",
                safeLevel: 0,
                updatedAt: "2025-01-24T08:22:44.407Z",
                email: "skoj@aren2"
            }
        })

        await act(async () => {
            const PageComponent = await Page({
                params: { locale: "en" },
                searchParams: { ppsn: "1" }
            })

            render(PageComponent)
        })

        await waitFor(() => {

            const summaryLists = screen.getAllByLabelText('Summary list')
            expect(screen.getByRole("heading", { name: "PPSN" })).toBeInTheDocument()
            const summaryListPPSN = summaryLists[2];
            expect(summaryListPPSN).toBeInTheDocument();
            expect(within(summaryListPPSN).getByText('PPSN')).toBeInTheDocument();
            expect(within(summaryListPPSN).getByText('12345')).toBeInTheDocument();
            expect(within(summaryListPPSN).getByText('clickToHide')).toBeInTheDocument();
            expect(loggerErrorSpy).not.toBeCalled()
        })
    })

    it("should render only the bare minimum data of first and last name if everything else is absent", async () => {
        getProfile.mockResolvedValueOnce({
            data: {
                details: {
                    preferredLanguage: "en",
                    ppsn: undefined,
                    address: undefined,
                    city: undefined,
                    dateOfBirth: undefined,
                    email: "",
                    firstName: "Name",
                    lastName: "Namesson",
                    phone: undefined
                },
                id: "",
                primaryUserId: "",
                publicName: "Name Namesson X",
                createdAt: "",
                preferredLanguage: "en",
                safeLevel: 0,
                updatedAt: "",
                email: ""
            }
        })

        await act(async () => {
            const PageComponent = await Page({
                params: { locale: "en" },
            })

            render(PageComponent)
        })

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "profile" })).toBeInTheDocument()
            expect(screen.getByRole("heading", { name: "publicName" })).toBeInTheDocument()
            expect(screen.getByRole("heading", { name: "name" })).toBeInTheDocument()

            const summaryLists = screen.getAllByLabelText('Summary list')
            expect(summaryLists).toHaveLength(1)
            const summaryListName = summaryLists[0];
            expect(summaryListName).toBeInTheDocument();

            expect(within(summaryListName).getByText('firstName')).toBeInTheDocument();
            expect(within(summaryListName).getByText('lastName')).toBeInTheDocument();
            expect(within(summaryListName).getByText('Name')).toBeInTheDocument();
            expect(within(summaryListName).getByText('Namesson')).toBeInTheDocument();
            expect(loggerErrorSpy).not.toBeCalled()
        })
    })

    it("should handle error from the profile fetch", async () => {
        getProfile.mockResolvedValueOnce({
            error: {
                code: "code",
                detail: "detail",
                requestId: "123",
                name: "name",
            }
        })

        await act(async () => {
            const PageComponent = await Page({
                params: { locale: "en" },
            })

            render(PageComponent)
        })

        await waitFor(() => {
            expect(loggerErrorSpy).toHaveBeenCalledOnce()
            expect(loggerErrorSpy).toBeCalledWith({
                code: "code",
                detail: "detail",
                requestId: "123",
                name: "name",
            })
        })
    })

    it("should handle throw from the profile fetch", async () => {
        getProfile.mockRejectedValueOnce(new Error("some failure"))

        await act(async () => {
            const PageComponent = await Page({
                params: { locale: "en" },
            })

            render(PageComponent)
        })

        await waitFor(() => {
            expect(loggerErrorSpy).toHaveBeenCalledOnce()
            expect(loggerErrorSpy).toBeCalledWith(new Error("some failure"))
        })
    })
})