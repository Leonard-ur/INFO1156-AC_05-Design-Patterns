# 🏗️ Entity Builder Pattern - Documentación de Solución Implementada

## Resumen del Problema Original

Las tres entidades principales tenían constructores enormes con parámetros en orden específico:

- **PostEntity**: 14 parámetros
- **CommentEntity**: 11 parámetros  
- **LikeEntity**: 9 parámetros

Esto causaba:
- ❌ Fácil confundirse con el orden de parámetros
- ❌ Errores al intercambiar valores
- ❌ Duplicación de lógica derivada
- ❌ Código poco legible

## ✅ Solución Implementada

Se crearon **tres builders fluidos** que resuelven el problema:

### 1. **PostEntityBuilder** (`src/posts/post.entity.builder.ts`)

```typescript
new PostEntityBuilder()
    .withId(1)
    .withTitle("Mi Post")
    .withDescription("Descripción")
    .withImageUrl("https://...")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withLikesCount(5)
    .withCommentsCount(2)
    .withRelevanceScore(25)
    .withSource("feed-controller")
    .withMetadata({ /* ... */ })
    .withRankingMode("latest")
    .build()
```

**Campos derivados calculados automáticamente:**
- `isFeatured`: `relevanceScore > 20`
- `tags`: palabras del título con > 4 caracteres

### 2. **CommentEntityBuilder** (`src/posts/comment.entity.builder.ts`)

```typescript
new CommentEntityBuilder()
    .withId(1)
    .withPostId(1)
    .withContent("Comentario...")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withSource("controller")
    .withModerationState("approved")
    .withLanguage("es")
    .withMetadata({ /* ... */ })
    .build()
```

**Campos derivados calculados automáticamente:**
- `sentimentScore`: 70 si contenido > 80 caracteres, sino 45
- `isPinned`: `length % 2 === 0`

**Métodos de override (si necesitas valores específicos):**
- `.withSentimentScore(score)` - para override manual
- `.withIsPinned(isPinned)` - para override manual

### 3. **LikeEntityBuilder** (`src/posts/like.entity.builder.ts`)

```typescript
new LikeEntityBuilder()
    .withId(1)
    .withPostId(1)
    .withReactionType("like")
    .withWeight(3)
    .withCreatedAt(new Date())
    .withSource("controller")
    .withShouldAffectRelevanceScore(true)
    .withMetadata({ /* ... */ })
    .build()
```

**Campos derivados calculados automáticamente:**
- `strengthLabel`: "strong" si weight > 2, sino "normal"

## 📝 Cambios en el Controller

El archivo `src/posts/posts.controller.ts` fue actualizado en 3 lugares:

### 1. **getFeed()** - Creación de PostEntity
**Antes:**
```typescript
return new PostEntity(
    post.id,
    post.title,
    post.description,
    post.imageUrl,
    post.createdAt,
    post.updatedAt,
    likesCount,
    commentsCount,
    relevanceScore,
    relevanceScore > 20,        // ← Cálculo manual
    "feed-controller",
    tags,                        // ← Derivado extraido fuera
    metadata,
    mode,
)
```

**Después:**
```typescript
return new PostEntityBuilder()
    .withId(post.id)
    .withTitle(post.title)
    .withDescription(post.description)
    .withImageUrl(post.imageUrl)
    .withCreatedAt(post.createdAt)
    .withUpdatedAt(post.updatedAt)
    .withLikesCount(likesCount)
    .withCommentsCount(commentsCount)
    .withRelevanceScore(relevanceScore)
    .withSource("feed-controller")
    .withMetadata(metadata)
    .withRankingMode(mode)
    .build()  // ← isFeatured y tags se calculan automáticamente
```

### 2. **getComments()** - Creación de CommentEntity  
### 3. **createComment()** - Creación de CommentEntity
### 4. **addLike()** - Creación de LikeEntity

## 🎯 Beneficios de la Solución

| Beneficio | Antes | Después |
|-----------|-------|---------|
| **Legibilidad** | Parámetros sin contexto | Métodos auto-descriptivos |
| **Errores** | Fácil intercambiar orden | Imposible equivocarse |
| **Mantenibilidad** | Lógica derivada dispersa | Centralizada en builder |
| **Flexibilidad** | Constructor único | Métodos opcionales y configurables |
| **Testabilidad** | Muchos parámetros en test | Builders más claros |

## 🔍 Lógica de Campos Derivados

### PostEntityBuilder
```typescript
build() {
    const isFeatured = this.relevanceScore > 20      // Auto-calculado
    const tags = this.title
        .split(" ")
        .filter((word) => word.length > 4)           // Auto-calculado
    // ... crear entidad con estos valores
}
```

### CommentEntityBuilder
```typescript
build() {
    // Permite override si es necesario
    const sentimentScore = 
        this.sentimentScoreOverride ?? 
        (this.content.length > 80 ? 70 : 45)
    const isPinned = 
        this.isPinnedOverride ?? 
        (this.content.length % 2 === 0)
    // ... crear entidad
}
```

### LikeEntityBuilder
```typescript
build() {
    const strengthLabel = this.weight > 2 
        ? "strong" 
        : "normal"                                   // Auto-calculado
    // ... crear entidad
}
```

## 📦 Archivo de Índice

Se creó `src/posts/builders.index.ts` para facilitar las importaciones:

```typescript
export { PostEntityBuilder } from "./post.entity.builder"
export { CommentEntityBuilder } from "./comment.entity.builder"
export { LikeEntityBuilder } from "./like.entity.builder"
```

Permite importar de forma limpia:
```typescript
import {
    PostEntityBuilder,
    CommentEntityBuilder,
    LikeEntityBuilder,
} from "@/posts/builders.index"
```

## ✅ Validación de Campos Requeridos

Cada builder valida que los campos requeridos hayan sido configurados:

```typescript
build() {
    if (this.id === undefined || this.postId === undefined || /* ... */) {
        throw new Error(
            "Builder: Missing required fields. Ensure all fields are set."
        )
    }
    // ... construir entidad
}
```

## 🚀 Próximos Pasos (Opcional)

1. **Ejecutar tests**: `npm run test` para verificar que todo funciona
2. **Agregar más validaciones**: Regex para URLs, validaciones de rango, etc.
3. **Crear fixtures**: Para usar en tests con datos predefinidos
4. **Documentar en README**: Agregar ejemplos de uso

## 📝 Conclusión

La implementación del **Entity Builder Pattern** proporciona:

✅ Código más legible y mantenible
✅ Eliminación de errores por orden de parámetros
✅ Automatización de campos derivados
✅ Mejor experiencia en tests y desarrollo
