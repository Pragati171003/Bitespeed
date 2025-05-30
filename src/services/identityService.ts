import { Op, Transaction } from 'sequelize';
import Contact, { LinkPrecedence } from '../models/Contact';
import sequelize from '../config/database';

interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

interface IdentifyResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export const identifyContact = async (data: IdentifyRequest): Promise<IdentifyResponse> => {
  const { email, phoneNumber } = data;

  if (!email && !phoneNumber) {
    throw new Error('Either email or phoneNumber must be provided.');
  }

  return sequelize.transaction(async (transaction: Transaction) => {
    // Find contacts matching email or phone number
    const orConditions = [];
    if (email) orConditions.push({ email });
    if (phoneNumber) orConditions.push({ phoneNumber });

    let matchingContacts = await Contact.findAll({
      where: {
        [Op.or]: orConditions,
      },
      order: [['createdAt', 'ASC']], 
      transaction,
    });

    // Scenario 1: No existing contacts
    if (matchingContacts.length === 0) {
      const newContact = await Contact.create(
        {
          email: email || null,
          phoneNumber: phoneNumber || null,
          linkPrecedence: LinkPrecedence.PRIMARY,
        },
        { transaction }
      );
      return {
        contact: {
          primaryContactId: newContact.id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
          secondaryContactIds: [],
        },
      };
    }

    // Scenario 2: Existing contacts found
    let primaryContact = matchingContacts.find(c => c.linkPrecedence === LinkPrecedence.PRIMARY);
    
    if (!primaryContact && matchingContacts[0].linkedId) {
        const rootPrimary = await Contact.findByPk(matchingContacts[0].linkedId, { transaction });
        if (rootPrimary) primaryContact = rootPrimary;
        else { 
            primaryContact = matchingContacts[0]; 
            primaryContact.linkPrecedence = LinkPrecedence.PRIMARY;
            primaryContact.linkedId = null;
            await primaryContact.save({ transaction });
        }
    } else if (!primaryContact) {
        primaryContact = matchingContacts[0];
        primaryContact.linkPrecedence = LinkPrecedence.PRIMARY;
        primaryContact.linkedId = null;
        await primaryContact.save({ transaction });
    }

    // Collect all related contacts (the entire "identity group")
    const allRelatedContactIds = new Set<number>();
    const primaryIds = new Set<number>();

    matchingContacts.forEach(c => {
        if (c.linkPrecedence === LinkPrecedence.PRIMARY) {
            primaryIds.add(c.id);
            allRelatedContactIds.add(c.id);
        } else if (c.linkedId) {
            primaryIds.add(c.linkedId);
            allRelatedContactIds.add(c.id);
            allRelatedContactIds.add(c.linkedId);
        }
    });
    
    if (primaryContact) {
        primaryIds.add(primaryContact.id);
        allRelatedContactIds.add(primaryContact.id);
    }


    let allGroupContacts = await Contact.findAll({
        where: {
            [Op.or]: [
                { id: { [Op.in]: Array.from(primaryIds) } },
                { linkedId: { [Op.in]: Array.from(primaryIds) } }
            ]
        },
        order: [['createdAt', 'ASC']],
        transaction
    });
    
    let ultimatePrimaryContact = allGroupContacts
        .filter(c => c.linkPrecedence === LinkPrecedence.PRIMARY)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

    if (!ultimatePrimaryContact) { 
        ultimatePrimaryContact = allGroupContacts[0]; 
        ultimatePrimaryContact.linkPrecedence = LinkPrecedence.PRIMARY;
        ultimatePrimaryContact.linkedId = null;
    }
    
    const ultimatePrimaryId = ultimatePrimaryContact.id;

    const updates: Promise<any>[] = [];
    allGroupContacts.forEach(contact => {
        if (contact.id !== ultimatePrimaryId) {
            if (contact.linkPrecedence === LinkPrecedence.PRIMARY) {
                contact.linkPrecedence = LinkPrecedence.SECONDARY;
                contact.linkedId = ultimatePrimaryId;
                updates.push(contact.save({ transaction }));
            } else if (contact.linkedId !== ultimatePrimaryId && contact.linkedId !== null) {

                const oldPrimary = allGroupContacts.find(c => c.id === contact.linkedId);
                if (oldPrimary && oldPrimary.id !== ultimatePrimaryId) {
                     contact.linkedId = ultimatePrimaryId;
                     updates.push(contact.save({ transaction }));
                }
            }
        }
    });
    await Promise.all(updates);
    

    allGroupContacts = await Contact.findAll({
        where: {
            [Op.or]: [
                { id: ultimatePrimaryId },
                { linkedId: ultimatePrimaryId }
            ]
        },
        order: [['createdAt', 'ASC']],
        transaction
    });
    ultimatePrimaryContact = allGroupContacts.find(c => c.id === ultimatePrimaryId)!;


    const existingEmails = new Set(allGroupContacts.map(c => c.email).filter(Boolean));
    const existingPhoneNumbers = new Set(allGroupContacts.map(c => c.phoneNumber).filter(Boolean));

    const newEmailProvided = email && !existingEmails.has(email);
    const newPhoneNumberProvided = phoneNumber && !existingPhoneNumbers.has(phoneNumber);
    
    let createdNewSecondary = false;

    if ((email || phoneNumber) && (newEmailProvided || newPhoneNumberProvided)) {

        const exactMatchExists = allGroupContacts.some(c => {
            const cEmail = c.email || null;
            const cPhone = c.phoneNumber || null;
            return cEmail === (email || null) && cPhone === (phoneNumber || null);
        });

        if (!exactMatchExists) {
            const newSecondaryContact = await Contact.create(
                {
                    email: email || null,
                    phoneNumber: phoneNumber || null,
                    linkedId: ultimatePrimaryId,
                    linkPrecedence: LinkPrecedence.SECONDARY,
                },
                { transaction }
            );
            allGroupContacts.push(newSecondaryContact); 
            createdNewSecondary = true;
        }
    }
    

    const finalEmails = new Set<string>();
    const finalPhoneNumbers = new Set<string>();
    const secondaryContactIds: number[] = [];


    if (ultimatePrimaryContact.email) finalEmails.add(ultimatePrimaryContact.email);
    if (ultimatePrimaryContact.phoneNumber) finalPhoneNumbers.add(ultimatePrimaryContact.phoneNumber);

    allGroupContacts.forEach(contact => {
      if (contact.id !== ultimatePrimaryId) {
        secondaryContactIds.push(contact.id);
      }
      if (contact.email) finalEmails.add(contact.email);
      if (contact.phoneNumber) finalPhoneNumbers.add(contact.phoneNumber);
    });


    const emailsArray = Array.from(finalEmails);
    if (ultimatePrimaryContact.email && emailsArray.includes(ultimatePrimaryContact.email)) {
        const index = emailsArray.indexOf(ultimatePrimaryContact.email);
        if (index > 0) {
            emailsArray.splice(index, 1);
            emailsArray.unshift(ultimatePrimaryContact.email);
        }
    }

    const phoneNumbersArray = Array.from(finalPhoneNumbers);
    if (ultimatePrimaryContact.phoneNumber && phoneNumbersArray.includes(ultimatePrimaryContact.phoneNumber)) {
        const index = phoneNumbersArray.indexOf(ultimatePrimaryContact.phoneNumber);
        if (index > 0) {
            phoneNumbersArray.splice(index, 1);
            phoneNumbersArray.unshift(ultimatePrimaryContact.phoneNumber);
        }
    }
    
    return {
      contact: {
        primaryContactId: ultimatePrimaryId,
        emails: emailsArray,
        phoneNumbers: phoneNumbersArray,
        secondaryContactIds: Array.from(new Set(secondaryContactIds)), 
      },
    };
  });
};