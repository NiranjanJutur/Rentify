import { supabase } from '../utils/supabase';

// ============================================
// PROPERTIES
// ============================================
export const propertyService = {
  async getAll() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(property: {
    name: string;
    address?: string;
    property_type?: string;
    total_rooms?: number;
    base_rent?: number;
    amenities?: string[];
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('properties')
      .insert([{ ...property, owner_id: user?.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('properties')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// TENANTS
// ============================================
export const tenantService = {
  async getAll(propertyId?: string) {
    let query = supabase.from('tenants').select('*').order('room', { ascending: true });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(tenant: {
    property_id: string;
    name: string;
    phone?: string;
    email?: string;
    room: string;
    block?: string;
    floor?: number;
    rent_amount?: number;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('tenants')
      .insert([tenant])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('tenants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('tenants').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// STAFF
// ============================================
export const staffService = {
  async getAll(propertyId?: string) {
    let query = supabase.from('staff').select('*').order('name', { ascending: true });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(staffMember: {
    property_id: string;
    name: string;
    role: string;
    shift?: string;
    phone?: string;
    salary?: number;
  }) {
    const { data, error } = await supabase
      .from('staff')
      .insert([staffMember])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('staff')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// EXPENSES
// ============================================
export const expenseService = {
  async getAll(propertyId?: string) {
    let query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getSummary(propertyId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, status, expense_type')
      .eq('property_id', propertyId);
    if (error) throw error;

    const totalExpenses = (data || []).reduce((sum, e) => sum + Number(e.amount), 0);
    const pendingExpenses = (data || []).filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0);
    return { totalExpenses, pendingExpenses };
  },

  async create(expense: {
    property_id: string;
    category: string;
    description?: string;
    amount: number;
    expense_type?: string;
    due_date?: string;
  }) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// PAYMENTS
// ============================================
export const paymentService = {
  async getAll(propertyId?: string) {
    let query = supabase
      .from('payments')
      .select('*, tenants(name, room, block)')
      .order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getSummary(propertyId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('property_id', propertyId);
    if (error) throw error;

    const collected = (data || []).filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
    const pending = (data || []).filter(p => p.status !== 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
    return { collected, pending, total: collected + pending };
  },

  async create(payment: {
    tenant_id: string;
    property_id: string;
    amount: number;
    status?: string;
    method?: string;
    due_date?: string;
    month?: string;
  }) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markPaid(id: string, method: string = 'UPI') {
    const { data, error } = await supabase
      .from('payments')
      .update({ status: 'paid', method, paid_date: new Date().toISOString().split('T')[0] })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// COMPLAINTS
// ============================================
export const complaintService = {
  async getAll(propertyId?: string) {
    let query = supabase
      .from('complaints')
      .select('*, tenants(name, room)')
      .order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(complaint: {
    property_id: string;
    tenant_id?: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
  }) {
    const { data, error } = await supabase
      .from('complaints')
      .insert([complaint])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// NOTICES
// ============================================
export const noticeService = {
  async getAll(propertyId?: string) {
    let query = supabase
      .from('notices')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (propertyId) query = query.eq('property_id', propertyId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(notice: {
    property_id: string;
    title: string;
    body?: string;
    category?: string;
    priority?: string;
    pinned?: boolean;
  }) {
    const { data, error } = await supabase
      .from('notices')
      .insert([notice])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('notices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) throw error;
  },

  async togglePin(id: string, pinned: boolean) {
    const { data, error } = await supabase
      .from('notices')
      .update({ pinned, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// AUTH
// ============================================
export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
