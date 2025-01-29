import { Heading, Link, Stack } from "@govie-ds/react";
import styles from "./style.module.scss"
import MenuLink from "./MenuLink";


export default function DrawerMenuContent(props: React.PropsWithChildren<{ name: string, selfHref: string, selfLabel: string; signoutLabel: string }>) {
    return (
        <div className={styles["drawer-menu"]}>
            <Stack direction="column" gap={8}>
                <div>
                    <Heading as="h2" size="md">{props.name}</Heading>
                    <MenuLink bold href={props.selfHref}>{props.selfLabel}</MenuLink>
                </div>
                <div>
                    {props.children}
                </div>
            </Stack>

            <Link href="/signout" asButton={{
                size: "large",
            }}>{props.signoutLabel}</Link>
        </div >
    )
}