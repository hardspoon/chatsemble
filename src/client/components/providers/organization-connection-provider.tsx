"use client";

import {
	useOrganizationConnection,
	type UseOrganizationConnectionProps,
} from "@client/hooks/organization/use-organization-connection";

import { type ReactNode, createContext, useContext } from "react";

const OrganizationConnectionContext = createContext<ReturnType<
	typeof useOrganizationConnection
> | null>(null);

interface OrganizationConnectionProviderProps
	extends UseOrganizationConnectionProps {
	children: ReactNode;
}

export function OrganizationConnectionProvider({
	children,
	...props
}: OrganizationConnectionProviderProps) {
	const connectionState = useOrganizationConnection(props);

	return (
		<OrganizationConnectionContext.Provider value={connectionState}>
			{children}
		</OrganizationConnectionContext.Provider>
	);
}

export function useOrganizationConnectionContext() {
	const context = useContext(OrganizationConnectionContext);
	if (!context) {
		throw new Error(
			"useOrganizationConnectionContext must be used within a OrganizationConnectionProvider",
		);
	}
	return context;
}
