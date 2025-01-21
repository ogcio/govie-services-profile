// biome-ignore lint/correctness/noUnusedImports: <explanation>
import React from "react"
import type { PropsWithChildren, ReactElement } from "react"
import "./PageMenu.css"
import { Icon, type IconPropTypes } from "@govie-ds/react"

export function PageMenuItem(
  props: PropsWithChildren<{
    icon: IconPropTypes["icon"]
    isSelected?: boolean
    href: string
  }>,
) {
  return (
    <li className={`${props.isSelected ? "selected-menu-item" : ""}`}>
      <Icon icon={props.icon} className='menu-icon' ariaLabel={props.icon} />
      <a href={props.href}>{props.children}</a>
    </li>
  )
}

export default function PageMenu(props: {
  userName: string
  topItems: ReactElement[]
  bottomItems?: ReactElement[]
}) {
  return (
    <div className='main-content-page-menu'>
      <div className='user-name'>{props.userName}</div>
      <ol>{props.topItems}</ol>
      {props.bottomItems?.length ? <hr /> : null}
      <ol data-testid='category menu'>{props.bottomItems}</ol>
    </div>
  )
}
