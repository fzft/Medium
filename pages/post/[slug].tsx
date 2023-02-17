import React from 'react';
import PortableText from 'react-portable-text';
import Header from '../../components/Header';
import { sanityClient, urlFor } from '../../sanity';
import { IPost } from '../../typings';
import {useForm, SubmitHandler} from 'react-hook-form';

interface IFormInput {
    _id: string;
    name: string;
    email: string;
    comment: string;
}

interface Props {
    post: IPost
}

export default function Post(props: Props) {
    const [submitted, setSubmitted] = React.useState<boolean>(false);
    const {register, handleSubmit, formState: {errors}} = useForm<IFormInput>();
    const onsubmit: SubmitHandler<IFormInput> = async (data) => {
        fetch("/api/createComment", {
            method: "POST",
            body: JSON.stringify(data),
        }).then(()=>{
            console.log(data);
            setSubmitted(true);
        }).catch((err)=>{
            console.log(err);
        });
    }
    console.log(props.post)
  return (
    <main>
        <Header></Header>
        <img className='w-full h-40 object-cover' src={urlFor(props.post.mainImage).url()!} alt="" />
        <article className='max-w-3xl mx-auto p-5'>
            <h1 className='text-3xl mt-10 mb-3'>{props.post.title}</h1>
            <h2 className='text-xl font-light text-gray-500'>{props.post.slug.current}</h2>
            <div className='flex items-center'>
                <img className='h-10 w-10 rounded-full' src={urlFor(props.post.author.image).url()!} alt="" />
                <p className='font-extralight text-sm'>
                Blog post by <span className='text-green-500'> {props.post.author.name}</span>  - Published at {" "} {new Date(props.post._createdAt).toLocaleString()}
            </p>
            </div>
            <div>
                <PortableText content={props.post.body} dataset={process.env.NEXT_PUBLIC_SANITY_DATASET} projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}></PortableText>
            </div>
        </article>
        <hr className='max-w-lg my-5 mx-auto border border-yellow-500' />
        {submitted ? (
            <div className='flex flex-col py-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto'>
                <h3 className='text-3xl font-bold'>Thank you for submitting your comment!</h3>
                <p> Once it has been approved, it will appear below!
                </p>
            </div>
        ) : (<form className='flex flex-col p-10 max-w-2xl mx-auto mb-10' onSubmit={handleSubmit(onsubmit)}>
        <h3 className='text-sm text-yellow-500'>Enjoyed this article?</h3>
        <h2 className='text-3xl font-bold'>Leave a comment below!</h2>
        <hr className='py-3 mt-2' />

        <input type="hidden" {...register("_id")} name="_id" value={props.post._id} />

        <label className="block mb-5 " >
            <span className='text-gray-700'>Name</span>
            <input {...register("name", {required: true})} className='shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring' type="text" placeholder='John Appleseed' />
        </label>
        <label className="block mb-5 "  >
            <span className='text-gray-700'>Email</span>
            <input {...register("email", {required:true})} className='shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 outline-none focus:ring' type="email" placeholder='John Appleseed' />
        </label>
        <label className="block mb-5 " >
            <span className='text-gray-700'>Comment</span>
            <textarea {...register("comment", {required:true})} className='shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 outline-none focus:ring ring-0'  placeholder='John Appleseed' rows={8} />
        </label>
        <div className='flex flex-col p-5 '>
            {errors.name && <p className='text-red-500'>Name is required</p>}
            {errors.email && <p className='text-red-500'>Email is required</p>}
            {errors.comment && <p className='text-red-500'>Comment is required</p>}
        </div>
        <input className='shadow bg-yellow-500 hover:bg-yellow-400 focus:outline-none
         text-white font-bold py-2 px-4 rounded cursor-pointer' type="submit" />
    </form>)}
    {/** Comments */}
    <div className='flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500'>
        <h3 className='text-4xl'>Comments</h3>
        <hr className='pb-2'/>
        {props.post.comments.map((comment: any) => (
             <div key={comment._id}>
                <p>
                    <span className='text-yellow-500'> {comment.name}</span>
                     :{comment.comment}</p>
            </div>
        ))}
    </div>
        
    </main>
  )
}

export const getStaticPaths = async () => {
    const query = `
    *[_type == "post"]{
        _id,
        slug {
          current
        }
      }`;
    const posts = await sanityClient.fetch(query);
    const paths = posts.map((post: IPost) => ({
        params: {slug: post.slug.current}
    }))  

    return {
        paths: paths,
        fallback: 'blocking'
    }
}

export const getStaticProps = async (context: any) => {
    const query = `
    *[_type == "post"&&slug.current == $slug][0]{
        _id,
        _createdAt,
          title,
          author->{
            name,
            image,
          },
          'comments':*[
          _type=="comment"&&
          post._ref == ^._id&&
          approved == true
          ],
          mainImage,
        slug,
          body
      }`;
      const post = await sanityClient.fetch(query, {slug: context.params?.slug});
      if (!post) {
          return {
              notFound: true
          }
      }
      return {
            props: {
                post,
            },
            revalidate: 60 // after 60 seconds, it will try to generate a new page
            
      }
}
