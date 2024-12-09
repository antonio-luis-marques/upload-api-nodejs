import * as create from './Create'
import * as getPosts from './Get'
import * as getPostById  from './GetById'
import * as addAnswer from './Update'

export const PostController = {
    ...create,
    ...getPosts,
    ...getPostById,
    ...addAnswer
}