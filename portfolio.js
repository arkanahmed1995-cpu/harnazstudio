import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_BUCKET } from "./supabase-config.js";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("PASTE_");

if (configured) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const gallery = document.querySelector(".real-gallery");
  if (gallery) {
    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("id,title,category,image_path,created_at")
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data) && data.length) {
        for (const item of data) {
          const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(item.image_path);
          const card = document.createElement("div");
          card.className = "project-card uploaded-project";
          const categoryText = String(item.category || "").toLowerCase();
          if (/dress|closet|wardrobe|clothes|جلد|ملابس|خزان/.test(categoryText)) card.dataset.category = "closet";
          else if (/bed|bedroom|sleep|نووستن|نوم/.test(categoryText)) card.dataset.category = "bedroom";
          else if (/kitchen|چێشت|مطبخ/.test(categoryText)) card.dataset.category = "kitchen";
          else if (/living|lounge|sitting|دانیشتن|معيشة/.test(categoryText)) card.dataset.category = "living";
          else card.dataset.category = "other";
          const link = document.createElement("a");
          link.className = "project-photo";
          link.href = urlData.publicUrl;
          link.target = "_blank";
          link.rel = "noopener";
          const image = document.createElement("img");
          image.src = urlData.publicUrl;
          image.alt = item.title || "HARNaz Studio project";
          image.loading = "lazy";
          link.appendChild(image);
          const label = document.createElement("div");
          label.className = "project-label";
          const title = document.createElement("strong");
          title.textContent = item.title || "HARNaz Studio Project";
          const category = document.createElement("span");
          category.textContent = item.category || "Interior design";
          label.append(title, category);
          card.append(link, label);
          gallery.appendChild(card);          if (window.harnazApplyPortfolioFilter) window.harnazApplyPortfolioFilter();
        }
      }
    } catch (error) {
      console.warn("HARNaz online portfolio could not be loaded.", error);
    }
  }
}
