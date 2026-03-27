-- Tabela de categorias
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📁',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de desenhos
CREATE TABLE drawings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  svg_content TEXT NOT NULL,
  is_built_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir categoria padrão (idempotente)
INSERT INTO categories (id, name, emoji, is_default)
VALUES ('00000000-0000-0000-0000-000000000001', 'Sem Categoria', '📁', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: leitura pública, escrita somente para usuários autenticados
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Auth insert categories" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update categories" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete categories" ON categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Public read drawings" ON drawings FOR SELECT USING (true);
CREATE POLICY "Auth insert drawings" ON drawings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update drawings" ON drawings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete drawings" ON drawings FOR DELETE USING (auth.role() = 'authenticated');
