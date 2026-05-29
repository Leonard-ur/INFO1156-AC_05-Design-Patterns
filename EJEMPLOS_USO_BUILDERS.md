# 📖 Ejemplos de Uso - Entity Builders

## PostEntityBuilder

### Ejemplo 1: Construcción Básica
```typescript
import { PostEntityBuilder } from "@/posts/builders.index"

const post = new PostEntityBuilder()
    .withId(1)
    .withTitle("Mi Publicación Increíble")
    .withDescription("Esta es una descripción detallada del post")
    .withImageUrl("https://example.com/image.jpg")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withLikesCount(5)
    .withCommentsCount(2)
    .withRelevanceScore(25)
    .withSource("user-input")
    .withMetadata({ userId: 123 })
    .withRankingMode("latest")
    .build()

console.log(post.isFeatured)  // true (porque relevanceScore > 20)
console.log(post.tags)        // ["Publicación", "Increíble", "descripción"]
```

### Ejemplo 2: En Controlador
```typescript
@Get("feed")
async getFeed(@Query() query: FeedQueryDto) {
    const posts = await this.prisma.post.findMany({
        include: { comments: true, likes: true }
    })

    const mappedPosts = posts.map(post => {
        const likesCount = post.likes.reduce((sum, l) => sum + l.weight, 0)
        const relevanceScore = this.calculateRelevance(post)

        return new PostEntityBuilder()
            .withId(post.id)
            .withTitle(post.title)
            .withDescription(post.description)
            .withImageUrl(post.imageUrl)
            .withCreatedAt(post.createdAt)
            .withUpdatedAt(post.updatedAt)
            .withLikesCount(likesCount)
            .withCommentsCount(post.comments.length)
            .withRelevanceScore(relevanceScore)
            .withSource("feed-controller")
            .withMetadata({ postType: "standard" })
            .withRankingMode(query.mode)
            .build()
    })

    return { posts: mappedPosts }
}
```

---

## CommentEntityBuilder

### Ejemplo 1: Construcción Básica con Auto-Cálculo
```typescript
import { CommentEntityBuilder } from "@/posts/builders.index"

const comment = new CommentEntityBuilder()
    .withId(42)
    .withPostId(1)
    .withContent("Este es un comentario muy largo que seguramente tendrá más de 80 caracteres para testear")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withSource("api-client")
    .withModerationState("approved")
    .withLanguage("es")
    .withMetadata({ clientVersion: "2.1.0" })
    .build()

console.log(comment.sentimentScore) // 70 (porque length > 80)
console.log(comment.isPinned)        // true (porque length % 2 === 0)
```

### Ejemplo 2: Con Override de Derivados
```typescript
const comment = new CommentEntityBuilder()
    .withId(42)
    .withPostId(1)
    .withContent("Short comment")
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .withSource("user-input")
    .withModerationState("pending")
    .withLanguage("es")
    .withSentimentScore(90)        // Override: fuerza un score específico
    .withIsPinned(false)            // Override: fuerza que NO esté pinned
    .build()

console.log(comment.sentimentScore) // 90 (override!)
console.log(comment.isPinned)        // false (override!)
```

### Ejemplo 3: En Controller - getComments
```typescript
@Get(":id/comments")
async getComments(@Param("id", ParseIntPipe) id: number) {
    const comments = await this.prisma.comment.findMany({
        where: { postId: id },
        orderBy: { createdAt: "desc" }
    })

    const entities = comments.map(comment =>
        new CommentEntityBuilder()
            .withId(comment.id)
            .withPostId(comment.postId)
            .withContent(comment.content)
            .withCreatedAt(comment.createdAt)
            .withUpdatedAt(comment.updatedAt)
            .withSource(comment.source)
            .withModerationState("approved")
            .withLanguage("es")
            .withMetadata({
                chars: comment.content.length,
                source: comment.source
            })
            .build()
    )

    return { total: entities.length, comments: entities }
}
```

### Ejemplo 4: En Controller - createComment con Overrides
```typescript
@Post(":id/comments")
async createComment(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: CreateCommentDto,
) {
    const created = await this.prisma.comment.create({
        data: {
            postId: id,
            content: body.content,
            source: "controller"
        }
    })

    // El moderator puede querer forzar un score diferente
    let builder = new CommentEntityBuilder()
        .withId(created.id)
        .withPostId(created.postId)
        .withContent(created.content)
        .withCreatedAt(created.createdAt)
        .withUpdatedAt(created.updatedAt)
        .withSource(created.source)
        .withModerationState("approved")
        .withLanguage("es")
        .withMetadata({ moderation: "auto-approved" })

    // Si el contenido es muy importante, boost el sentiment
    if (body.isFeaturedComment) {
        builder = builder.withSentimentScore(100)
    }

    const entity = builder.build()

    return { message: "comment_created", entity }
}
```

---

## LikeEntityBuilder

### Ejemplo 1: Construcción Básica
```typescript
import { LikeEntityBuilder } from "@/posts/builders.index"

const like = new LikeEntityBuilder()
    .withId(1)
    .withPostId(1)
    .withReactionType("like")
    .withWeight(1)
    .withCreatedAt(new Date())
    .withSource("web-client")
    .withShouldAffectRelevanceScore(true)
    .withMetadata({ userAgent: "Mozilla/5.0..." })
    .build()

console.log(like.strengthLabel) // "normal" (porque weight <= 2)
```

### Ejemplo 2: Reacción Fuerte
```typescript
const strongLike = new LikeEntityBuilder()
    .withId(2)
    .withPostId(1)
    .withReactionType("fire")
    .withWeight(3)          // weight > 2
    .withCreatedAt(new Date())
    .withSource("mobile-app")
    .withShouldAffectRelevanceScore(true)
    .withMetadata({ platform: "ios" })
    .build()

console.log(strongLike.strengthLabel) // "strong" (porque weight > 2)
```

### Ejemplo 3: En Controller
```typescript
@Post(":id/likes")
async addLike(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: AddLikeDto,
) {
    const post = await this.postsService.findById(id)
    if (!post) throw new NotFoundException("Post not found")

    const reactionType = body.reactionType || "like"
    const weight = body.weight || 1

    if (weight < 1) {
        throw new BadRequestException("Weight must be at least 1")
    }

    const like = await this.prisma.like.create({
        data: {
            postId: id,
            reactionType,
            weight,
            source: "controller"
        }
    })

    const entity = new LikeEntityBuilder()
        .withId(like.id)
        .withPostId(like.postId)
        .withReactionType(like.reactionType)
        .withWeight(like.weight)
        .withSource(like.source)
        .withCreatedAt(like.createdAt)
        .withShouldAffectRelevanceScore(true)
        .withMetadata({ from: "manual", r: like.reactionType })
        .build()

    return { success: true, like: entity }
}
```

---

## Casos de Uso Avanzados

### Caso 1: Bulk Creation
```typescript
const comments = rawCommentData.map(c =>
    new CommentEntityBuilder()
        .withId(c.id)
        .withPostId(c.postId)
        .withContent(c.content)
        .withCreatedAt(c.createdAt)
        .withUpdatedAt(c.updatedAt)
        .withSource("import")
        .build()
)
```

### Caso 2: Conditional Builders
```typescript
function createCommentFromSource(raw: any, source: string) {
    let builder = new CommentEntityBuilder()
        .withId(raw.id)
        .withPostId(raw.postId)
        .withContent(raw.content)
        .withCreatedAt(raw.createdAt)
        .withUpdatedAt(raw.updatedAt)
        .withSource(source)

    // Aplicar lógica específica por fuente
    if (source === "legacy-api") {
        builder = builder
            .withModerationState("pending")
            .withLanguage("unknown")
    } else if (source === "user-input") {
        builder = builder
            .withModerationState("approved")
            .withLanguage("es")
    }

    return builder.build()
}
```

### Caso 3: Testing
```typescript
// En tests, los builders hacen esto mucho más claro
describe("Feed Service", () => {
    it("should prioritize featured posts", () => {
        const post = new PostEntityBuilder()
            .withId(1)
            .withTitle("Important Post")
            .withDescription("Very important")
            .withImageUrl("https://example.com/img.jpg")
            .withCreatedAt(new Date())
            .withUpdatedAt(new Date())
            .withLikesCount(10)
            .withCommentsCount(5)
            .withRelevanceScore(30)  // isFeatured será true
            .build()

        expect(post.isFeatured).toBe(true)
    })
})
```

---

## Patrones Comunes

### Patrón 1: Enriquecimiento Progresivo
```typescript
let builder = new PostEntityBuilder()
    .withId(post.id)
    .withTitle(post.title)
    .withDescription(post.description)

if (includeMetadata) {
    builder = builder.withMetadata({ /* rich metadata */ })
}

if (includeRanking) {
    builder = builder.withRankingMode(mode)
}

const entity = builder.build()
```

### Patrón 2: Factory Method
```typescript
function createPostEntityFromPrisma(post: PrismaPost) {
    return new PostEntityBuilder()
        .withId(post.id)
        .withTitle(post.title)
        .withDescription(post.description)
        .withImageUrl(post.imageUrl)
        .withCreatedAt(post.createdAt)
        .withUpdatedAt(post.updatedAt)
        .withLikesCount(calculateLikes(post.likes))
        .withCommentsCount(post.comments.length)
        .withRelevanceScore(calculateRelevance(post))
        .withSource("database")
        .build()
}
```

---

## ✅ Mejores Prácticas

1. **Siempre establece todos los campos requeridos** antes de llamar `build()`
2. **Usa el builder una sola vez** - crea nuevas instancias para cada entidad
3. **Aprovecha los derivados automáticos** - no lo hagas manualmente
4. **Documente el source** - siempre establece de dónde viene la entidad
5. **Valida antes de construir** - usa los builders de manera segura

---

**Genero**: Referencia técnica  
**Última actualización**: 2026-05-28  
**Versión**: 1.0
