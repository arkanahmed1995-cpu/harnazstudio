import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_BUCKET } from "./supabase-config.js";

const byId = (id) => document.getElementById(id);
const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_") && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("PASTE_");
byId("year").textContent = new Date().getFullYear();
if (!configured) {
  byId("setup-warning").classList.remove("hidden");
  byId("login-form").querySelector("button").disabled = true;
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const loginPanel = byId("login-panel");
  const dashboard = byId("dashboard");
  const loginMessage = byId("login-message");
  const uploadMessage = byId("upload-message");

  async function showDashboard(session) {
    if (!session) { loginPanel.classList.remove("hidden"); dashboard.classList.add("hidden"); return; }
    const { data: allowed, error } = await supabase.rpc("is_studio_admin");
    if (error || allowed !== true) {
      await supabase.auth.signOut();
      loginMessage.textContent = "ئەم هەژمارە دەسەڵاتی بەڕێوەبردنی سایتەکەی نییە.";
      loginPanel.classList.remove("hidden"); dashboard.classList.add("hidden"); return;
    }
    loginPanel.classList.add("hidden"); dashboard.classList.remove("hidden");
    await loadItems();
  }

  byId("login-form").addEventListener("submit", async (event) => {
    event.preventDefault(); loginMessage.textContent = "... چاوەڕێ بکە";
    const email = byId("email").value.trim();
    const password = byId("password").value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { loginMessage.textContent = "چوونەژوورەوە سەرکەوتوو نەبوو. ئیمەیڵ و وشەی نهێنی بپشکنە."; return; }
    await showDashboard(data.session);
  });

  byId("logout").addEventListener("click", async () => { await supabase.auth.signOut(); await showDashboard(null); });
  supabase.auth.onAuthStateChange((_event, session) => { if (!session) showDashboard(null); });

  async function loadItems() {
    const holder = byId("items"); holder.replaceChildren();
    const { data, error } = await supabase.from("portfolio_items").select("id,title,category,image_path,created_at").order("created_at", { ascending: false });
    if (error) { holder.textContent = "نەتوانرا وێنەکان بهێنرێن. ڕێکخستنی Supabase بپشکنە."; return; }
    byId("item-count").textContent = `${data.length} وێنە`;
    if (!data.length) { const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "هێشتا وێنەیەکی زیادکراوت نییە."; holder.appendChild(empty); return; }
    for (const item of data) {
      const { data: url } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(item.image_path);
      const card = document.createElement("article"); card.className = "item-card";
      const img = document.createElement("img"); img.src = url.publicUrl; img.alt = item.title; img.loading = "lazy";
      const info = document.createElement("div"); info.className = "item-info";
      const title = document.createElement("strong"); title.textContent = item.title;
      const category = document.createElement("span"); category.textContent = item.category;
      const del = document.createElement("button"); del.className = "delete"; del.type = "button"; del.textContent = "سڕینەوەی وێنە";
      del.addEventListener("click", () => deleteItem(item, del));
      info.append(title, category, del); card.append(img, info); holder.appendChild(card);
    }
  }

  async function deleteItem(item, button) {
    if (!confirm(`دڵنیایت لە سڕینەوەی «${item.title}»؟`)) return;
    button.disabled = true; button.textContent = "...";
    const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([item.image_path]);
    if (storageError) { button.disabled = false; button.textContent = "سڕینەوەی وێنە"; alert("وێنەکە نەسڕایەوە. دووبارە هەوڵ بدەرەوە."); return; }
    const { error: rowError } = await supabase.from("portfolio_items").delete().eq("id", item.id);
    if (rowError) { alert("فایلی وێنەکە سڕایەوە، بەڵام تۆماری پڕۆژەکە نەسڕایەوە. پەیوەندی بە پشتگیری بکە."); }
    await loadItems();
  }

  byId("upload-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = byId("image-file").files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) { uploadMessage.textContent = "تەنها JPG، PNG، WEBP یان AVIF قبوڵ دەکرێت."; return; }
    if (file.size > 10 * 1024 * 1024) { uploadMessage.textContent = "قەبارەی وێنەکە نابێت لە 10MB زیاتر بێت."; return; }
    const button = byId("upload-button"); button.disabled = true; uploadMessage.textContent = "وێنەکە بار دەکرێت...";
    const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "project-image";
    const path = `${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (uploadError) { uploadMessage.textContent = "بارکردنی وێنە سەرکەوتوو نەبوو. ڕێکخستنی Supabase بپشکنە."; button.disabled = false; return; }
    const { error: insertError } = await supabase.from("portfolio_items").insert({ title: byId("title").value.trim(), category: byId("category").value, image_path: path });
    if (insertError) { await supabase.storage.from(STORAGE_BUCKET).remove([path]); uploadMessage.textContent = "وێنەکە هەڵنەگیرا. ڕێکخستنی داتابەیس بپشکنە."; button.disabled = false; return; }
    byId("upload-form").reset(); uploadMessage.textContent = "وێنەکە بە سەرکەوتوویی زیاد کرا."; button.disabled = false; await loadItems();
  });

  const { data: { session } } = await supabase.auth.getSession();
  await showDashboard(session);
}
