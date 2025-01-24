
import { describe, expect, it, vi } from "vitest"
import updateProfileUserAction from "./action"
import { AuthenticationFactory } from "../../utils/authentication-factory"
import { beforeEach } from "vitest"


vi.mock("../../utils/authentication-factory", () => ({
    AuthenticationFactory: {
        getProfileClient: vi.fn().mockResolvedValueOnce({
            updateProfile: vi.fn().mockResolvedValue({})
        }),
    }
}))

vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn().mockResolvedValue((s: string) => s),
}))

const loggerErrorSpy = vi.hoisted(vi.fn)
vi.mock("@ogcio/nextjs-logging-wrapper/common-logger", async (impl) => ({
    ...(await impl()),
    getCommonLogger: vi.fn().mockImplementation(() => ({
        error: loggerErrorSpy,
    })),
}))


describe(updateProfileUserAction.name, () => {

    beforeEach(() => {
        loggerErrorSpy.mockReset()
    })

    it("should return correct state after successful profile update", async () => {
        const formData = new FormData()
        formData.append("publicName", "Another Name")
        const prevState = { publicName: "Test Name", userId: "123" }
        const expected = { publicName: "Another Name", userId: "123" }
        const actual = await updateProfileUserAction(prevState, formData)
        expect(actual).toEqual(expected)
        expect(loggerErrorSpy).not.toBeCalled()
    })

    it("should return correct state if form data name doesn't have a publicName key", async () => {
        const formData = new FormData()
        const prevState = { publicName: "Test Name", userId: "123" }
        const expected = { publicName: "", userId: "123", validationError: "emptyPublicName" }
        const actual = await updateProfileUserAction(prevState, formData)
        expect(actual).toEqual(expected)
        expect(loggerErrorSpy).not.toBeCalled()
    })

    it("should return correct state if the authentication factory throws", async () => {
        AuthenticationFactory.getProfileClient = vi.fn().mockRejectedValueOnce(new Error("fail"))
        const formData = new FormData()
        formData.append("publicName", "Another Name")
        const prevState = { publicName: "Test Name", userId: "123" }
        const expected = { publicName: "Another Name", userId: "123", fatalServerError: "fail" }

        const actual = await updateProfileUserAction(prevState, formData)

        expect(actual).toEqual(expected)
        expect(loggerErrorSpy).toHaveBeenCalledOnce()
        expect(loggerErrorSpy).toBeCalledWith(new Error("fail"))
    })

    it("should return correct state if updateProfile returns an error property that doesn't include field name validation", async () => {
        AuthenticationFactory.getProfileClient = vi.fn().mockResolvedValueOnce({
            updateProfile: vi.fn().mockResolvedValue({
                error: {
                    code: "code",
                    detail: "detail",
                    requestId: "1",
                    name: "name",
                }
            })
        })

        const formData = new FormData()
        formData.append("publicName", "Another Name")
        const prevState = { publicName: "Test Name", userId: "123" }
        const expected = {
            publicName: "Another Name", userId: "123", serverError: {
                code: "code",
                detail: "detail",
                requestId: "1",
                name: "name",
            }
        }

        const actual = await updateProfileUserAction(prevState, formData)

        expect(actual).toEqual(expected)
        // expect(loggerErrorSpy).toHaveBeenCalledOnce()
        expect(loggerErrorSpy).toBeCalledWith({
            code: "code",
            detail: "detail",
            requestId: "1",
            name: "name",
        })
    })

    it("should return correct state if updateProfile returns an error property that include publicName field in validation property", async () => {
        AuthenticationFactory.getProfileClient = vi.fn().mockResolvedValueOnce({
            updateProfile: vi.fn().mockResolvedValue({
                error: {
                    code: "code",
                    detail: "detail",
                    requestId: "1",
                    name: "name",
                    validation: [{ fieldName: "publicName", message: "failed" }]
                }
            })
        })

        const formData = new FormData()
        formData.append("publicName", "Another Name")

        const prevState = { publicName: "Test Name", userId: "123" }
        const expected = {
            publicName: "Another Name", userId: "123", validationError: "failed"
        }

        const actual = await updateProfileUserAction(prevState, formData)

        expect(actual).toEqual(expected)
        expect(loggerErrorSpy).toHaveBeenCalledOnce()
        expect(loggerErrorSpy).toBeCalledWith({
            code: "code",
            detail: "detail",
            requestId: "1",
            name: "name",
            validation: [{ fieldName: "publicName", message: "failed" }]
        })
    })
})