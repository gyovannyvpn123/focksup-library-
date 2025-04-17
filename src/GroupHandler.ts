/**
 * Handler for WhatsApp group operations
 */

import { WAConnection } from './WAConnection';
import { GroupInfo, GroupParticipant, GroupUpdate } from './Types';
import { validatePhoneNumber, generateRandomId } from './Utils';
import { createLogger } from './Utils';

export class GroupHandler {
    private connection: WAConnection;
    private logger: ReturnType<typeof createLogger>;
    
    constructor(connection: WAConnection) {
        this.connection = connection;
        this.logger = createLogger('GroupHandler');
    }
    
    /**
     * Create a new group
     * @param name Group name
     * @param participants Array of participant phone numbers
     */
    async createGroup(name: string, participants: string[]): Promise<{ id: string, participants: string[] }> {
        try {
            // Validate and format participant numbers
            const validParticipants = participants.map(validatePhoneNumber);
            
            const response = await this.connection.sendRequest({
                type: 'group_create',
                data: {
                    name,
                    participants: validParticipants
                }
            });
            
            this.logger.info(`Created group "${name}" with ${validParticipants.length} participants`);
            
            return {
                id: response.groupId,
                participants: validParticipants
            };
        } catch (error) {
            this.logger.error('Failed to create group:', error);
            throw error;
        }
    }
    
    /**
     * Get group information
     * @param groupId Group ID
     */
    async getGroupInfo(groupId: string): Promise<GroupInfo> {
        try {
            const response = await this.connection.sendRequest({
                type: 'group_info',
                data: {
                    groupId
                }
            });
            
            this.logger.info(`Retrieved info for group ${groupId}`);
            
            return response.groupInfo;
        } catch (error) {
            this.logger.error('Failed to get group info:', error);
            throw error;
        }
    }
    
    /**
     * Add participants to a group
     * @param groupId Group ID
     * @param participants Array of participant phone numbers
     */
    async addParticipants(groupId: string, participants: string[]): Promise<{ added: string[], failed: string[] }> {
        try {
            // Validate and format participant numbers
            const validParticipants = participants.map(validatePhoneNumber);
            
            const response = await this.connection.sendRequest({
                type: 'group_participants',
                data: {
                    groupId,
                    action: 'add',
                    participants: validParticipants
                }
            });
            
            this.logger.info(`Added ${response.added.length} participants to group ${groupId}`);
            
            return {
                added: response.added,
                failed: response.failed
            };
        } catch (error) {
            this.logger.error('Failed to add participants:', error);
            throw error;
        }
    }
    
    /**
     * Remove participants from a group
     * @param groupId Group ID
     * @param participants Array of participant phone numbers
     */
    async removeParticipants(groupId: string, participants: string[]): Promise<{ removed: string[], failed: string[] }> {
        try {
            // Validate and format participant numbers
            const validParticipants = participants.map(validatePhoneNumber);
            
            const response = await this.connection.sendRequest({
                type: 'group_participants',
                data: {
                    groupId,
                    action: 'remove',
                    participants: validParticipants
                }
            });
            
            this.logger.info(`Removed ${response.removed.length} participants from group ${groupId}`);
            
            return {
                removed: response.removed,
                failed: response.failed
            };
        } catch (error) {
            this.logger.error('Failed to remove participants:', error);
            throw error;
        }
    }
    
    /**
     * Promote participants to admin
     * @param groupId Group ID
     * @param participants Array of participant phone numbers
     */
    async promoteParticipants(groupId: string, participants: string[]): Promise<{ promoted: string[], failed: string[] }> {
        try {
            // Validate and format participant numbers
            const validParticipants = participants.map(validatePhoneNumber);
            
            const response = await this.connection.sendRequest({
                type: 'group_participants',
                data: {
                    groupId,
                    action: 'promote',
                    participants: validParticipants
                }
            });
            
            this.logger.info(`Promoted ${response.promoted.length} participants to admin in group ${groupId}`);
            
            return {
                promoted: response.promoted,
                failed: response.failed
            };
        } catch (error) {
            this.logger.error('Failed to promote participants:', error);
            throw error;
        }
    }
    
    /**
     * Demote participants from admin
     * @param groupId Group ID
     * @param participants Array of participant phone numbers
     */
    async demoteParticipants(groupId: string, participants: string[]): Promise<{ demoted: string[], failed: string[] }> {
        try {
            // Validate and format participant numbers
            const validParticipants = participants.map(validatePhoneNumber);
            
            const response = await this.connection.sendRequest({
                type: 'group_participants',
                data: {
                    groupId,
                    action: 'demote',
                    participants: validParticipants
                }
            });
            
            this.logger.info(`Demoted ${response.demoted.length} participants from admin in group ${groupId}`);
            
            return {
                demoted: response.demoted,
                failed: response.failed
            };
        } catch (error) {
            this.logger.error('Failed to demote participants:', error);
            throw error;
        }
    }
    
    /**
     * Leave a group
     * @param groupId Group ID
     */
    async leaveGroup(groupId: string): Promise<void> {
        try {
            await this.connection.sendRequest({
                type: 'group_leave',
                data: {
                    groupId
                }
            });
            
            this.logger.info(`Left group ${groupId}`);
        } catch (error) {
            this.logger.error('Failed to leave group:', error);
            throw error;
        }
    }
    
    /**
     * Update group subject (name)
     * @param groupId Group ID
     * @param subject New group subject
     */
    async updateGroupSubject(groupId: string, subject: string): Promise<void> {
        try {
            await this.connection.sendRequest({
                type: 'group_update',
                data: {
                    groupId,
                    updateType: 'subject',
                    subject
                }
            });
            
            this.logger.info(`Updated subject of group ${groupId} to "${subject}"`);
        } catch (error) {
            this.logger.error('Failed to update group subject:', error);
            throw error;
        }
    }
    
    /**
     * Update group description
     * @param groupId Group ID
     * @param description New group description
     */
    async updateGroupDescription(groupId: string, description: string): Promise<void> {
        try {
            await this.connection.sendRequest({
                type: 'group_update',
                data: {
                    groupId,
                    updateType: 'description',
                    description
                }
            });
            
            this.logger.info(`Updated description of group ${groupId}`);
        } catch (error) {
            this.logger.error('Failed to update group description:', error);
            throw error;
        }
    }
    
    /**
     * Update group settings
     * @param groupId Group ID
     * @param settings Settings to update
     */
    async updateGroupSettings(groupId: string, settings: { onlyAdminsMessage?: boolean, onlyAdminsEditInfo?: boolean }): Promise<void> {
        try {
            await this.connection.sendRequest({
                type: 'group_update',
                data: {
                    groupId,
                    updateType: 'settings',
                    settings
                }
            });
            
            this.logger.info(`Updated settings of group ${groupId}`);
        } catch (error) {
            this.logger.error('Failed to update group settings:', error);
            throw error;
        }
    }
    
    /**
     * Get invite link for a group
     * @param groupId Group ID
     */
    async getGroupInviteLink(groupId: string): Promise<string> {
        try {
            const response = await this.connection.sendRequest({
                type: 'group_invite_link',
                data: {
                    groupId
                }
            });
            
            this.logger.info(`Retrieved invite link for group ${groupId}`);
            
            return response.inviteLink;
        } catch (error) {
            this.logger.error('Failed to get group invite link:', error);
            throw error;
        }
    }
}
