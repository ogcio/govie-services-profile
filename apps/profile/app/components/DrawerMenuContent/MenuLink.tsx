import type { PropsWithChildren } from "react";
import styles from "./style.module.scss"

export default function MenuLink(props: PropsWithChildren<{ href: string, bold?: boolean }>) {
    const classes = ["gi-header-menu-list-item"]
    if (props.bold) {
        classes.push(styles["menu-link-bold"])
    }
    return <a className={classes.join(" ")} href={props.href} >{props.children}</a>
}