import React from "react"
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import PublicNameForm from "./PublicNameForm"
import { useFormState, useFormStatus } from "react-dom"

vi.mock("../../utils/authentication-factory", () => ({
    AuthenticationFactory: {
        getProfileClient: vi.fn().mockResolvedValueOnce({
            updateProfile: vi.fn().mockResolvedValue({})
        }),
    }
}))

vi.mock("next-intl", () => ({
    useTranslations: vi.fn().mockReturnValue((s: string) => s),
}))

vi.mock("react-dom", async (original) => ({
    ...(await original()),
    useFormState: vi.fn().mockReturnValue([{}, () => 1]),
    useFormStatus: vi.fn().mockReturnValue({ pending: false })
}))

describe(PublicNameForm.name, () => {

    it("should render correctly", async () => {
        render(<PublicNameForm publicName="Public Name" userId="123" />)

        await waitFor(() => {
            const label = screen.getByText("publicName")
            expect(label).toBeInTheDocument()

            const input = screen.getByLabelText("publicName")
            expect(input).toBeInTheDocument()
            expect(input).toHaveValue("Public Name")

            const submit = screen.getByRole("button", { name: "update" })
            expect(submit).toBeInTheDocument()
        })
    })

    it("should handle getting an validation error from the useFormHook", async () => {
        const mockedUseFormState = useFormState as Mock
        mockedUseFormState.mockReturnValueOnce([{ userId: "123", publicName: "Updated Name", validationError: "validation error" }, function () { }, false])

        render(<PublicNameForm publicName="Public Name" userId="123" />)
        await waitFor(() => {
            expect(screen.getByText("validation error")).toBeInTheDocument()
        })
    })

    /**
     * If anyone figures out how to successfully verify when a Toast gets displayed
     * add such tests here.
     */
})