"use client"
import React, { useRef } from "react"
import { Button, Spinner, TextInput, Toast } from "@govie-ds/react"
import styles from "../../[locale]/layout.module.scss"
import { useTranslations } from "next-intl"
import updateProfileUserAction from "./action"
import { useFormState, useFormStatus } from "react-dom"
import { useEffect } from "react"

function SubmitButton() {
    const tProfile = useTranslations("Profile")

    const status = useFormStatus()

    return <Button disabled={status.pending} className={styles.flex_align} type="submit">{tProfile("update")}
        {status.pending && < Spinner />}
    </Button>
}

export default function PublicNameForm(props: { publicName: string, userId: string }) {
    const tProfile = useTranslations("Profile")
    const [state, action] = useFormState(updateProfileUserAction, { ...props })
    const prevPublicName = useRef(props.publicName)


    useEffect(() => {
        if (state.publicName && state.publicName !== prevPublicName.current && !state.fatalServerError && !state.serverError) {
            (document.querySelector("#success-toast-trigger") as HTMLButtonElement)?.click()
        }
        prevPublicName.current = state.publicName
    }, [state.publicName])

    useEffect(() => {
        if (state.fatalServerError || state.serverError) {
            const btn = document.querySelector("#fail-toast-trigger") as HTMLButtonElement
            btn?.click()
        }
    }, [state.fatalServerError, state.serverError])


    return <>
        <Toast title={tProfile("publicNameUpdatedToast")} position={{ x: "right", y: "top" }} variant="success"
            trigger={<button id="success-toast-trigger" style={{ display: "none" }}></button>} />
        <Toast title={tProfile("publicNameFailedUpdatedToast")} position={{ x: "right", y: "top" }} variant="danger"
            trigger={<button id="fail-toast-trigger" style={{ display: "none" }}></button>} />

        <form className={[styles.flex_col, styles.gap_2].join(" ")} action={action}>
            <div className={[styles.flex_row, styles.gap_1, styles.flex_wrap].join(" ")}>
                <TextInput
                    id="publicName"
                    name="publicName"
                    defaultValue={props.publicName}
                    className={[styles.flex_1, styles.text_input].join(" ")}
                    label={{ text: tProfile("publicName"), htmlFor: "publicName" }}
                    error={state.validationError ? { text: state.validationError } : undefined} />
            </div>
            <div>
                <SubmitButton />
            </div>
        </form>
    </>
}