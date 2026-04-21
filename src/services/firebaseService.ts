import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../utils/firebase';

export const firebaseDataService = {
  // Properties
  async getProperties(ownerId: string) {
    const q = query(collection(db, 'properties'), where('owner_id', '==', ownerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async registerProperty(propertyData: any) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const newPropertyRef = doc(collection(db, 'properties'));
    const data = {
      ...propertyData,
      owner_id: user.uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    await setDoc(newPropertyRef, data);
    return { id: newPropertyRef.id, ...data };
  },

  // Tenants
  async getTenants(propertyId: string) {
    const q = query(collection(db, 'tenants'), where('property_id', '==', propertyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addTenant(tenantData: any) {
    const newTenantRef = doc(collection(db, 'tenants'));
    const data = {
      ...tenantData,
      created_at: serverTimestamp(),
      status: 'active'
    };
    await setDoc(newTenantRef, data);
    return { id: newTenantRef.id, ...data };
  },

  // Expenses
  async getExpenses(propertyId: string) {
    const q = query(collection(db, 'expenses'), where('property_id', '==', propertyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
