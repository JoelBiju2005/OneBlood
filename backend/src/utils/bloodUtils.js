/**
   * Blood Compatibility Matrix Rules
   */

// For Red Blood Cells (Whole Blood, PRBC)
const RBC_COMPATIBILITY = {
  // Donor -> Recipients it can donate to
  donate: {
    'O-':  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'O+':  ['A+', 'B+', 'AB+', 'O+'],
    'A-':  ['A+', 'A-', 'AB+', 'AB-'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B+', 'B-', 'AB+', 'AB-'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB+', 'AB-'],
    'AB+': ['AB+'],
  },
  // Recipient -> Donors it can receive from
  receive: {
    'O-':  ['O-'],
    'O+':  ['O+', 'O-'],
    'A-':  ['A-', 'O-'],
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'B-':  ['B-', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  }
};

// For Plasma
const PLASMA_COMPATIBILITY = {
  // Donor -> Recipients it can donate plasma to (Reverse of RBC)
  donate: {
    'O-':  ['O-', 'O+'],
    'O+':  ['O+'],
    'A-':  ['A-', 'A+', 'O-', 'O+'],
    'A+':  ['A+', 'O+'],
    'B-':  ['B-', 'B+', 'O-', 'O+'],
    'B+':  ['B+', 'O+'],
    'AB-': ['A-', 'B-', 'AB-', 'O-', 'A+', 'B+', 'AB+', 'O+'],
    'AB+': ['A+', 'B+', 'AB+', 'O+']
  },
  // Recipient -> Donors it can receive plasma from
  receive: {
    'O-':  ['O-', 'A-', 'B-', 'AB-', 'O+', 'A+', 'B+', 'AB+'],
    'O+':  ['O+', 'A+', 'B+', 'AB+'],
    'A-':  ['A-', 'AB-', 'A+', 'AB+'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B-', 'AB-', 'B+', 'AB+'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  }
};

// For Platelets
const PLATELET_COMPATIBILITY = {
  // Platelets prefer ABO matching but can use other groups in emergency. 
  // Standard ABO matches are:
  donate: {
    'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+':  ['O+', 'A+', 'B+', 'AB+'],
    'A-':  ['A-', 'A+', 'AB-', 'AB+'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B-', 'B+', 'AB-', 'AB+'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  },
  receive: {
    'O-':  ['O-'],
    'O+':  ['O+', 'O-'],
    'A-':  ['A-', 'O-'],
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'B-':  ['B-', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
  }
};

/**
 * Checks compatibility between donor and recipient
 * @param {string} donorGroup e.g., 'O-'
 * @param {string} recipientGroup e.g., 'AB+'
 * @param {string} component e.g., 'whole_blood', 'plasma', 'platelets'
 * @returns {boolean} compatibility
 */
const isCompatible = (donorGroup, recipientGroup, component = 'whole_blood') => {
  const dG = donorGroup.toUpperCase();
  const rG = recipientGroup.toUpperCase();
  
  if (component === 'plasma') {
    return PLASMA_COMPATIBILITY.receive[rG]?.includes(dG) || false;
  } else if (component === 'platelets') {
    return PLATELET_COMPATIBILITY.receive[rG]?.includes(dG) || false;
  }
  
  // Default is RBC/whole blood/packed RBC
  return RBC_COMPATIBILITY.receive[rG]?.includes(dG) || false;
};

/**
 * Gets list of compatible donor groups for a recipient group
 */
const getCompatibleDonors = (recipientGroup, component = 'whole_blood') => {
  const rG = recipientGroup.toUpperCase();
  if (component === 'plasma') {
    return PLASMA_COMPATIBILITY.receive[rG] || [];
  } else if (component === 'platelets') {
    return PLATELET_COMPATIBILITY.receive[rG] || [];
  }
  return RBC_COMPATIBILITY.receive[rG] || [];
};

module.exports = {
  isCompatible,
  getCompatibleDonors,
  RBC_COMPATIBILITY,
  PLASMA_COMPATIBILITY,
  PLATELET_COMPATIBILITY
};
