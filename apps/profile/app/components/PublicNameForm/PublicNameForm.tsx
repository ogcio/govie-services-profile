"use client"
import { Button, TextInput } from "@govie-ds/react"
import styles from "../../[locale]/layout.module.scss"
import { useTranslations } from "next-intl"
import updateProfileUserAction from "./action"
import { useFormState } from "react-dom"
import { ApiProfileUser } from "../../../types"

export default function PublicNameForm(props: { profileUser: ApiProfileUser, userId: string }) {
    const tProfile = useTranslations("Profile")
    const [state, action] = useFormState(updateProfileUserAction, { ...props.profileUser, userId: props.userId })

    return <form className={[styles.flex_col, styles.gap_2].join(" ")} action={action}>
        <div className={[styles.flex_row, styles.gap_1, styles.flex_wrap].join(" ")}>
            <TextInput name="publicName" defaultValue={props.profileUser.publicName} className={[styles.flex_1, styles.text_input].join(" ")} label={{ text: tProfile("publicName") }} />
        </div>
        <div>
            <Button className={styles.flex_align} type="submit">{tProfile("update")}</Button>
        </div>
    </form>
}