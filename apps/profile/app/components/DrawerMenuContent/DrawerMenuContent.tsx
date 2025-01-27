import { Heading, Link, Stack, SectionBreak } from "@govie-ds/react";
import styles from "./style.module.scss"

export default function DrawerMenuContent(props: React.PropsWithChildren<{ name: string, selfHref: string, selfLabel: string; signoutLabel: string }>) {
    return (
        <div className={styles["drawer-menu"]}>
            <Stack direction="column" gap={12}>
                <Stack direction="column" gap={3}>
                    <Heading as="h2" size="md">{props.name}</Heading>
                    <Stack direction="column" gap={3} hasDivider>
                        <Link noColor noUnderline href={props.selfHref} size="md">{props.selfLabel}</Link>
                        <div />
                    </Stack>
                </Stack>
                <Stack direction="column" gap={3} hasDivider>
                    {props.children}
                </Stack>
            </Stack>

            <Link href="/signout" asButton={{
                size: "large",
            }}>{props.signoutLabel}</Link>
        </div >
    )
}