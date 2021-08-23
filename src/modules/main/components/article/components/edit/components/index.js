import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import httpRequest from 'common/utils/httpRequest';
import MarkDownEditor from 'common/components/MarkDownEditor/components';
import AsyncCreatableSelect from 'react-select/async-creatable';
import Card from 'common/components/Card/components';
import Breadcrumb from 'common/components/Breadcrumb/components';
import history from 'common/utils/history';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import ImageInput from 'common/components/ImageInput/components';
import AsyncSelect from 'react-select/async';
import classNames from 'classnames';

const EditArticleComponent = () => {
	const auth = useSelector((state) => state.appAuth.current);
	const params = useParams();

	const [state, setState] = useState({
		data: {
			article: {}
		},
		loadings: {
			article: false
		}
	});

	const promiseTags = (q) => {
		return httpRequest
			.get({
				url: `/search`,
				token: auth.token.access_token,
				params: {
					type: 'tag',
					q: q
				}
			})
			.then((response) => {
				if (!response.data.success) {
					console.log('Error');
					return [];
				}
				return response.data.data;
			})
			.catch((error) => {
				console.log(error);
				return [];
			})
			.finally(() => {});
	};

	const promiseCategories = (q) => {
		return httpRequest
			.get({
				url: `/search`,
				token: auth.token.access_token,
				params: {
					type: 'category',
					q: q
				}
			})
			.then((response) => {
				if (!response.data.success) {
					console.log('Error');
					return [];
				}
				return response.data.data;
			})
			.catch((error) => {
				console.log(error);
				return [];
			})
			.finally(() => {});
	};

	useEffect(() => {
		setState((prevState) => ({
			...prevState,
			loadings: {
				...prevState.loadings,
				article: true
			}
		}));
		httpRequest
			.get({
				url: `/articles/${params.articleId}`,
				token: auth.token.access_token
			})
			.then((response) => {
				if (!response.data.success) {
					console.log('Error');
					return;
				}
				setState((prevState) => ({
					...prevState,
					data: {
						...prevState.data,
						article: response.data.data
					}
				}));
			})
			.catch((error) => {
				console.log(error);
			})
			.finally(() => {
				setState((prevState) => ({
					...prevState,
					loadings: {
						...prevState.loadings,
						article: false
					}
				}));
			});
	}, [auth.token.access_token, params.articleId]);

	const formik = useFormik({
		enableReinitialize: true,
		initialValues: {
			title: state.data.article.title,
			slug: state.data.article.slug,
			content: state.data.article.content,
			categories: state.data.article.categories,
			tags: state.data.article.tags,
			image: null,
			article_status: state.data.article.article_status,
			comment_status: state.data.article.comment_status,
			image_url: state.data.article.image
		},
		validationSchema: Yup.object({
			image: Yup.mixed()
				.test(
					'fileSize',
					'Image size too large, max image size is 2 MB',
					(value) => value === null || (value && value.size <= 2048 * 1024)
				)
				.test(
					'fileFormat',
					'Unsupported image format',
					(value) => value === null || (value && ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'].includes(value.type))
				),
			title: Yup.string().required('Title is required').max(166, 'Title is maximum 166 characters'),
			slug: Yup.string().max(200, 'Slug is maximum 200 characters'),
			content: Yup.string().required('Content is required').max(60000, 'Content is maximum 60000 characters'),
			categories: Yup.array().min(1, 'Choose at least 1 category').max(6, 'Choose up to 6 categories'),
			tags: Yup.array()
				.min(1, 'Choose at least 1 tag')
				.max(6, 'Choose up to 6 tags')
				.of(
					Yup.object().shape({
						title: Yup.string().required().max(66, 'Tag name is maximum 66 characters')
					})
				),
			article_status: Yup.string().oneOf(['publish', 'pending', 'draft'], 'Status invalid'),
			comment_status: Yup.string().oneOf(['open', 'closed'], 'Comments status invalid')
		}),
		onSubmit: (values, { setSubmitting, setErrors }) => {
			httpRequest
				.formDataPut({
					url: `/articles/${params.articleId}`,
					token: auth.token.access_token,
					data: {
						title: values.title,
						slug: values.slug,
						content: values.content,
						categories: JSON.stringify(values.categories),
						tags: JSON.stringify(values.tags),
						article_status: values.article_status,
						comment_status: values.comment_status
					},
					files: {
						image: values.image
					}
				})
				.then((response) => {
					if (!response.data.success) {
						console.log('Error');
					}
					history.push(`/main/articles`);
				})
				.catch((error) => {
					console.log(error);
				})
				.finally(() => {
					setSubmitting(false);
				});
		}
	});

	return (
		<>
			<div className="content-header py-3">
				<Breadcrumb>Edit article</Breadcrumb>
			</div>
			<div className="content-body">
				<Card header="Edit article">
					{state.loadings.article ? (
						<div>Loading...</div>
					) : (
						<form onSubmit={formik.handleSubmit} className="row g-3">
							<div className="col-md-12">
								<label htmlFor="image" className="form-label">
									Image <span className="text-danger">*</span>
								</label>
								<ImageInput
									name="image"
									id="image"
									onChange={formik.setFieldValue}
									onBlur={formik.setFieldTouched}
									previewUrl={formik.values.image_url}
								/>
								{formik.errors.image && formik.touched.image && (
									<div className="invalid-feedback d-block">{formik.errors.image}</div>
								)}
							</div>
							<div className="col-md-6">
								<label htmlFor="title" className="form-label">
									Title <span className="text-danger">*</span>
								</label>
								<input
									type="text"
									placeholder="Enter title"
									className={classNames('form-control', {
										'is-invalid': formik.errors.title && formik.touched.title
									})}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									value={formik.values.title}
									name="title"
									id="title"
								/>
								{formik.errors.title && formik.touched.title && <div className="invalid-feedback">{formik.errors.title}</div>}
							</div>
							<div className="col-md-6">
								<label htmlFor="slug" className="form-label">
									Slug
								</label>
								<input
									type="text"
									placeholder="Enter slug"
									className={classNames('form-control', {
										'is-invalid': formik.errors.slug && formik.touched.slug
									})}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									value={formik.values.slug}
									name="slug"
									id="slug"
								/>
								{formik.errors.slug && formik.touched.slug && <div className="invalid-feedback">{formik.errors.slug}</div>}
							</div>
							<div className="col-md-6">
								<label htmlFor="categories" className="form-label">
									Categories <span className="text-danger">*</span>
								</label>
								<AsyncSelect
									id="categories"
									name="categories"
									cacheOptions
									defaultOptions
									isMulti
									placeholder="Choose categories"
									onChange={(value) => formik.setFieldValue('categories', value)}
									onBlur={() => formik.setFieldTouched('categories', true)}
									value={formik.values.categories}
									loadOptions={promiseCategories}
									getOptionValue={(option) => option.id}
									getOptionLabel={(option) => option.title}
								/>
								{formik.errors.categories && formik.touched.categories && (
									<div className="invalid-feedback d-block">
										{formik.errors?.categories[0]?.title ? formik.errors.categories[0].title : formik.errors.categories}
									</div>
								)}
							</div>
							<div className="col-md-6">
								<label htmlFor="tags" className="form-label">
									Tags <span className="text-danger">*</span>
								</label>
								<AsyncCreatableSelect
									id="tags"
									name="tags"
									cacheOptions
									defaultOptions
									isMulti
									placeholder="Choose tags"
									onChange={(value) => formik.setFieldValue('tags', value)}
									onBlur={() => formik.setFieldTouched('tags', true)}
									value={formik.values.tags}
									getNewOptionData={(inputValue, optionLabel) => ({
										id: inputValue,
										title: optionLabel,
										is_new: true
									})}
									loadOptions={promiseTags}
									getOptionValue={(option) => option.id}
									getOptionLabel={(option) => option.title}
								/>
								{formik.errors.tags && formik.touched.tags && (
									<div className="invalid-feedback d-block">
										{formik.errors?.tags[0]?.title ? formik.errors.tags[0].title : formik.errors.tags}
									</div>
								)}
							</div>
							<div className="col-md-12">
								<label htmlFor="content" className="form-label">
									Content <span className="text-danger">*</span>
								</label>
								<MarkDownEditor
									id="content"
									placeholder="Enter content"
									value={formik.values.content}
									onChange={(value) => formik.setFieldValue('content', value)}
									onBlur={() => formik.setFieldTouched('content', true)}
								/>
								{formik.errors.content && formik.touched.content && (
									<div className="invalid-feedback d-block">{formik.errors.content}</div>
								)}
							</div>
							<div className="col-md-6">
								<label htmlFor="article_status" className="form-label">
									Article status <span className="text-danger">*</span>
								</label>
								<select
									className={classNames('form-select', {
										'is-invalid': formik.errors.article_status && formik.touched.article_status
									})}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									value={formik.values.article_status}
									name="article_status"
									id="article_status"
								>
									{[
										{ value: 'publish', label: 'Published' },
										{ value: 'pending', label: 'Pending' },
										{ value: 'draft', label: 'Draft' }
									].map((status, index) => (
										<option value={status.value} key={index}>
											{status.label}
										</option>
									))}
								</select>
								{formik.errors.article_status && formik.touched.article_status && (
									<div className="invalid-feedback">{formik.errors.article_status}</div>
								)}
							</div>
							<div className="col-md-6">
								<label htmlFor="comment_status" className="form-label">
									Comments status <span className="text-danger">*</span>
								</label>
								<select
									className={classNames('form-select', {
										'is-invalid': formik.errors.comment_status && formik.touched.comment_status
									})}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									value={formik.values.comment_status}
									name="comment_status"
									id="comment_status"
								>
									{[
										{ value: 'open', label: 'Open' },
										{ value: 'closed', label: 'Closed' }
									].map((status, index) => (
										<option value={status.value} key={index}>
											{status.label}
										</option>
									))}
								</select>
								{formik.errors.comment_status && formik.touched.comment_status && (
									<div className="invalid-feedback">{formik.errors.comment_status}</div>
								)}
							</div>
							<div className="col-md-12">
								<button className="btn btn-primary" type="submit" disabled={formik.isSubmitting}>
									{formik.isSubmitting ? 'Submitting' : 'Submit'}
								</button>
							</div>
						</form>
					)}
				</Card>
			</div>
		</>
	);
};

export default EditArticleComponent;
