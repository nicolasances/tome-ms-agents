
/**
 * Converts an Agent name to a path-friendly format.
 * 
 * Does the following transformations:
 * - Converts to lowercase
 * - Removes spaces
 * - Removes special characters
 * 
 * @param agentName the name of the Agent in the Agent Definition
 * @returns a path to be used for the agent
 */
export function agentNameToPath(agentName: string): string {
    
    return agentName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}