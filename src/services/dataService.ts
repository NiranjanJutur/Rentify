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

  async getMyProperties() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', user.id)
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

  async getByInviteCode(inviteCode: string) {
    const normalizedCode = inviteCode.trim().toUpperCase();
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, invite_code, status')
      .eq('invite_code', normalizedCode)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(property: {
    name: string;
    address?: string;
    property_type?: string;
    total_rooms?: number;
    total_floors?: number;
    base_rent?: number;
    room_label_prefix?: string;
    max_occupancy_per_room?: number;
    total_capacity?: number;
    owner_name?: string;
    owner_phone?: string;
    owner_email?: string;
    caretaker_name?: string;
    caretaker_phone?: string;
    building_notes?: string;
    property_config?: Record<string, any>;
    amenities?: string[];
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('No Supabase session found. Demo mode cannot save properties. Please sign in with a real owner account.');
    }
    const { data, error } = await supabase
      .from('properties')
      .insert([{ ...property, owner_id: user?.id }])
      .select()
      .single();
    if (error) {
      if (error.message?.toLowerCase().includes('row-level security')) {
        throw new Error('Property save was blocked by Supabase RLS. Make sure you are logged in with a real owner account and rerun the latest properties policy SQL.');
      }
      throw error;
    }
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

  async findTenant(room: string, phone: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('room', room)
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
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
    advance_amount?: number;
    payment_due_day?: number;
    status?: string;
    aadhaar_id?: string;
    aadhaar_front_url?: string;
    aadhaar_back_url?: string;
    tenant_photo_url?: string;
  }) {
    const { data: existing, error: existingError } = await supabase
      .from('tenants')
      .select('id, status, phone')
      .eq('property_id', tenant.property_id)
      .eq('room', tenant.room)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    const record = existing && existing.length > 0 ? existing[0] : null;

    if (record?.status && record.status === 'occupied' && record.phone !== tenant.phone) {
      throw new Error(`Room ${tenant.room} is currently occupied by another tenant.`);
    }
    let data: any;
    let error: any;

    if (record) {
      // Update the existing tenant record for this room
      ({ data, error } = await supabase
        .from('tenants')
        .update({
          ...tenant,
          status: tenant.status || 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id)
        .select()
        .single());
    } else {
      // Insert a new tenant record
      ({ data, error } = await supabase
        .from('tenants')
        .insert([{
          ...tenant,
          status: tenant.status || 'pending',
        }])
        .select()
        .single());
    }

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
    duty_days?: string[];
    payment_due_day?: number;
    notes?: string;
    photo_data?: string;
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
      .select('*, tenants(name, room, block, phone, payment_due_day)')
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

  async update(id: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
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
    room_label?: string;
    photo_data?: string;
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
// MEALS
// ============================================
export const mealService = {
  async submitVote(vote: {
    tenant_id: string;
    property_id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    response: 'yes' | 'no';
    date: string;
  }) {
    // Upsert the vote for this tenant/meal/date
    const { data, error } = await supabase
      .from('meal_responses')
      .upsert([vote], { onConflict: 'tenant_id,meal_type,date' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTodayVotes(propertyId: string, date: string) {
    const { data, error } = await supabase
      .from('meal_responses')
      .select('meal_type, response')
      .eq('property_id', propertyId)
      .eq('date', date);
    
    if (error) throw error;
    return data || [];
  },

  async getTenantVotesForDate(tenantId: string, date: string) {
    const { data, error } = await supabase
      .from('meal_responses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('date', date);
    
    if (error) throw error;
    return data || [];
  },

  async getDailyMenu(propertyId: string, date: string) {
    const { data, error } = await supabase
      .from('daily_menus')
      .select('*')
      .eq('property_id', propertyId)
      .eq('date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"
    return data;
  },

  async updateDailyMenu(menu: {
    property_id: string;
    date: string;
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    breakfast_time?: string;
    lunch_time?: string;
    dinner_time?: string;
  }) {
    const { data, error } = await supabase
      .from('daily_menus')
      .upsert([menu], { onConflict: 'property_id,date' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// AUTH
// ============================================
export const authService = {
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string, metadata?: Record<string, any>, emailRedirectTo?: string) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(metadata ? { data: metadata } : {}),
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });
  },

  async resendSignupConfirmation(email: string, emailRedirectTo?: string) {
    return await supabase.auth.resend({
      type: 'signup',
      email,
      ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
    });
  },

  async signOut() {
    return await supabase.auth.signOut();
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
