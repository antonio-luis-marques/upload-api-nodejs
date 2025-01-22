import * as create from './Create'
import * as getPosts from './Get'
import * as getPostById  from './GetById'

export const PostController = {
    ...create,
    ...getPosts,
    ...getPostById
}