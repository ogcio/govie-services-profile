"use server"

import { getTranslations } from "next-intl/server";
import { AuthenticationFactory } from "../../utils/authentication-factory";
import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"

type State = {
    publicName: string
    userId: string
    validationError?: string
    fatalServerError?: string
    serverError?: {
        code: string;
        detail: string;
        requestId: string;
        name: string;
        validation?: {
            fieldName: string;
            message: string;
        }[];
        validationContext?: string;
    }
}


export default async function updateProfileUserAction(prevState: State, formData: FormData): Promise<State> {
    const logger = getCommonLogger("error")
    const tError = await getTranslations("Profile")
    const publicName = formData.get("publicName")?.toString() || ""
    const { userId } = prevState
    if (!publicName) {
        return {
            publicName,
            validationError: tError("emptyPublicName"),
            userId,
        }
    }

    if (publicName === prevState.publicName) {
        return { userId, publicName }
    }

    try {
        const client = await AuthenticationFactory.getProfileClient()
        const result = await client.updateProfile(prevState.userId, {
            publicName
        })

        if (result.error) {
            logger.error(result.error)
            const publicNameFieldError = result.error.validation?.find(v => v.fieldName = "publicName")
            if (publicNameFieldError) {
                return {
                    publicName,
                    userId,
                    validationError: publicNameFieldError.message
                }
            }

            else {
                return {
                    publicName,
                    userId, serverError: result.error
                }
            }

        }

    } catch (err) {
        logger.error(err)
        return {
            publicName,
            fatalServerError: err.message,
            userId: prevState.userId,
        }
    }

    return { userId: prevState.userId, publicName, }
}