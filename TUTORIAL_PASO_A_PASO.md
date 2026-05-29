# 🎬 Tutorial: Cómo Usar los Builders

## Escena 1: Importar los Builders

```typescript
import {
    PostEntityBuilder,
    CommentEntityBuilder,
    LikeEntityBuilder,
} from "@/posts/builders.index"
```

## Escena 2: Crear un PostEntity

### Paso 1: Instanciar el builder
```typescript
const builder = new PostEntityBuilder()
```

### Paso 2: Establecer los campos (en cualquier orden)
```typescript
const post = builder
    .withId(1)
    .withTitle("Mi Primera Publicación")
    .withDescription("Esta es una descripción del post")
    .withImageUrl("https://example.com/image.jpg")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withLikesCount(5)
    .withCommentsCount(2)
    .withRelevanceScore(25)
    .withSource("user-input")
    .withMetadata({ category: "tech" })
    .withRankingMode("latest")
    .build()
```

### Paso 3: Usar la entidad
```typescript
console.log(post.id)           // 1
console.log(post.title)        // "Mi Primera Publicación"
console.log(post.isFeatured)   // true (25 > 20)
console.log(post.tags)         // ["Primera", "Publicación"]
```

---

## Escena 3: Crear un CommentEntity

### Opción A: Sin overrides (auto-calcula todo)
```typescript
const comment = new CommentEntityBuilder()
    .withId(1)
    .withPostId(1)
    .withContent("Este es un comentario muy largo que tiene más de 80 caracteres")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withSource("web")
    .withModerationState("approved")
    .withLanguage("es")
    .withMetadata({ userAgent: "Chrome" })
    .build()

console.log(comment.sentimentScore)  // 70 (length > 80)
console.log(comment.isPinned)        // true (length % 2 === 0)
```

### Opción B: Con overrides (valores específicos)
```typescript
const comment = new CommentEntityBuilder()
    .withId(1)
    .withPostId(1)
    .withContent("Short")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withSource("api")
    .withModerationState("pending")
    .withLanguage("es")
    .withSentimentScore(90)   // ← Override: fuerza este valor
    .withIsPinned(false)       // ← Override: fuerza este valor
    .build()

console.log(comment.sentimentScore)  // 90 (override aplicado)
console.log(comment.isPinned)        // false (override aplicado)
```

---

## Escena 4: Crear un LikeEntity

```typescript
const like = new LikeEntityBuilder()
    .withId(1)
    .withPostId(1)
    .withReactionType("fire")
    .withWeight(3)           // → strengthLabel será "strong"
    .withCreatedAt(new Date())
    .withSource("mobile-app")
    .withShouldAffectRelevanceScore(true)
    .withMetadata({ platform: "ios" })
    .build()

console.log(like.strengthLabel)  // "strong" (3 > 2)
```

---

## Escena 5: En el Controller - Ejemplo Real

```typescript
@Get("feed")
async getFeed(@Query() query: FeedQueryDto) {
    const posts = await this.prisma.post.findMany({
        include: { comments: true, likes: true }
    })

    const mappedPosts = posts.map(post => {
        // Cálculos
        const likesCount = post.likes.reduce((sum, l) => sum + l.weight, 0)
        const commentsCount = post.comments.length
        const relevanceScore = this.calculateRelevance(post)

        // Usar el builder
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
            .withMetadata({ page: query.page })
            .withRankingMode(query.mode)
            .build()
    })

    return { items: mappedPosts }
}
```

---

## Escena 6: Manejo de Errores

### ¿Qué pasa si olvidas un campo requerido?

```typescript
const post = new PostEntityBuilder()
    .withId(1)
    .withTitle("Incompleto")
    // ❌ Olvidas otros campos requeridos
    .build()

// Error: PostEntityBuilder: Missing required fields.
// Ensure all fields except optional ones are set.
```

### Solución: Establece todos los campos requeridos

```typescript
const post = new PostEntityBuilder()
    .withId(1)
    .withTitle("Completo")
    .withDescription("...")
    .withImageUrl("...")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withLikesCount(0)
    .withCommentsCount(0)
    .withRelevanceScore(10)
    .build()  // ✅ Funciona
```

---

## Escena 7: Patrones Avanzados

### Patrón: Constructor condicional

```typescript
function createPost(rawData: any, includeMetadata: boolean) {
    let builder = new PostEntityBuilder()
        .withId(rawData.id)
        .withTitle(rawData.title)
        .withDescription(rawData.description)
        .withImageUrl(rawData.imageUrl)
        .withCreatedAt(new Date())
        .withUpdatedAt(new Date())
        .withLikesCount(0)
        .withCommentsCount(0)
        .withRelevanceScore(0)

    if (includeMetadata) {
        builder = builder.withMetadata({ richData: true })
    }

    return builder.build()
}
```

### Patrón: Bulk creation

```typescript
const posts = rawPostsArray.map(raw =>
    new PostEntityBuilder()
        .withId(raw.id)
        .withTitle(raw.title)
        .withDescription(raw.description)
        .withImageUrl(raw.imageUrl)
        .withCreatedAt(new Date(raw.createdAt))
        .withUpdatedAt(new Date(raw.updatedAt))
        .withLikesCount(raw.likes.length)
        .withCommentsCount(raw.comments.length)
        .withRelevanceScore(this.calculate(raw))
        .build()
)
```

### Patrón: Factory method

```typescript
class PostEntityFactory {
    static fromPrismaModel(model: PrismaPost, context: string): PostEntity {
        return new PostEntityBuilder()
            .withId(model.id)
            .withTitle(model.title)
            .withDescription(model.description)
            .withImageUrl(model.imageUrl)
            .withCreatedAt(model.createdAt)
            .withUpdatedAt(model.updatedAt)
            .withLikesCount(model.likes.length)
            .withCommentsCount(model.comments.length)
            .withRelevanceScore(this.calculateRelevance(model))
            .withSource(context)
            .build()
    }

    private static calculateRelevance(model: PrismaPost): number {
        return model.likes.length * 2 + model.comments.length
    }
}

// Uso:
const post = PostEntityFactory.fromPrismaModel(dbPost, "feed")
```

---

## Escena 8: Testing

### Test básico
```typescript
describe("PostEntityBuilder", () => {
    it("should calculate isFeatured correctly", () => {
        const post = new PostEntityBuilder()
            .withId(1)
            .withTitle("Featured Post")
            .withDescription("Important")
            .withImageUrl("https://example.com/img.jpg")
            .withCreatedAt(new Date())
            .withUpdatedAt(new Date())
            .withLikesCount(10)
            .withCommentsCount(5)
            .withRelevanceScore(30)  // > 20
            .build()

        expect(post.isFeatured).toBe(true)
        expect(post.tags).toEqual(["Featured", "Post"])
    })

    it("should throw error when missing required fields", () => {
        const builder = new PostEntityBuilder()
            .withId(1)
            .withTitle("Title")

        expect(() => builder.build()).toThrow()
    })
})
```

---

## ✅ Checklist de Uso

- [ ] Importa los builders desde `@/posts/builders.index`
- [ ] Instancia un builder nuevo (`new PostEntityBuilder()`)
- [ ] Establece todos los campos requeridos
- [ ] Llama a `.build()` al final
- [ ] Captura la entidad resultante
- [ ] Usa la entidad (los derivados ya están calculados)

---

## 🎓 Lecciones Aprendidas

1. **Builder Pattern**: Crea objetos complejos paso a paso
2. **Fluent Interface**: Métodos retornan `this` para encadenamiento
3. **Auto-cálculo**: El builder calcula derivados en `build()`
4. **Validación**: Se validan campos requeridos en `build()`
5. **Flexibilidad**: Orden de métodos no importa

---

**Tipo**: Tutorial  
**Versión**: 1.0  
**Fecha**: 2026-05-28
