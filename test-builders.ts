/**
 * Script de prueba simple para validar los builders
 * Run: npx ts-node test-builders.ts
 */

import { PostEntityBuilder } from "./src/posts/post.entity.builder"
import { CommentEntityBuilder } from "./src/posts/comment.entity.builder"
import { LikeEntityBuilder } from "./src/posts/like.entity.builder"

const testPostBuilder = () => {
    const post = new PostEntityBuilder()
        .withId(1)
        .withTitle("Test Post with Long Title")
        .withDescription("Test description")
        .withImageUrl("https://example.com/image.jpg")
        .withCreatedAt(new Date())
        .withUpdatedAt(new Date())
        .withLikesCount(5)
        .withCommentsCount(2)
        .withRelevanceScore(25)
        .withSource("test")
        .withMetadata({ test: true })
        .withRankingMode("latest")
        .build()

    console.log("✅ PostEntity built successfully:")
    console.log(`   - ID: ${post.id}`)
    console.log(`   - Title: ${post.title}`)
    console.log(`   - isFeatured (derivado): ${post.isFeatured}`)
    console.log(`   - Tags (derivado): ${post.tags.join(", ")}`)
    console.log()
}

const testCommentBuilder = () => {
    const comment = new CommentEntityBuilder()
        .withId(1)
        .withPostId(1)
        .withContent("This is a really long comment that should affect sentiment and pinned status")
        .withCreatedAt(new Date())
        .withUpdatedAt(new Date())
        .withSource("test")
        .withModerationState("approved")
        .withLanguage("es")
        .withMetadata({ test: true })
        .build()

    console.log("✅ CommentEntity built successfully:")
    console.log(`   - ID: ${comment.id}`)
    console.log(`   - Content: ${comment.content.substring(0, 40)}...`)
    console.log(`   - sentimentScore (derivado): ${comment.sentimentScore}`)
    console.log(`   - isPinned (derivado): ${comment.isPinned}`)
    console.log()
}

const testLikeBuilder = () => {
    const like = new LikeEntityBuilder()
        .withId(1)
        .withPostId(1)
        .withReactionType("like")
        .withWeight(3)
        .withCreatedAt(new Date())
        .withSource("test")
        .withShouldAffectRelevanceScore(true)
        .withMetadata({ test: true })
        .build()

    console.log("✅ LikeEntity built successfully:")
    console.log(`   - ID: ${like.id}`)
    console.log(`   - Reaction Type: ${like.reactionType}`)
    console.log(`   - Weight: ${like.weight}`)
    console.log(`   - strengthLabel (derivado): ${like.strengthLabel}`)
    console.log()
}

console.log("\n🧪 Testing Entity Builders...\n")
try {
    testPostBuilder()
    testCommentBuilder()
    testLikeBuilder()
    console.log("✅ All builders working correctly!")
} catch (error) {
    console.error("❌ Error:", error)
}
