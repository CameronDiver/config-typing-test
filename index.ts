import { Either, isRight } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import * as _ from 'lodash';

const schema = {
	one: { source: 'test', type: t.string, default: undefined },
	two: { source: 'test', type: t.number, default: 123 },
	three: { source: 'test', type: t.boolean, default: undefined },
};

const fnSchema = {
	four: () => {
		return 4;
	},
};

type Schema = typeof schema;
type SchemaKey = keyof Schema;
type FnSchema = typeof fnSchema;
type FnSchemaKey = keyof FnSchema;

const retrieveKey = <T extends SchemaKey>(
	key: T,
): Either<t.Errors, t.TypeOf<Schema[T]['type']>> => {
	switch (key) {
		case 'one':
			return t.string.decode('test');
		case 'two':
			return t.number.decode(123);
		case 'three':
			return t.boolean.decode(false);
		default:
			throw new Error('test');
	}
};

function getSchema<T extends SchemaKey>(
	key: T,
):
	| t.TypeOf<Schema[T]['type']>
	| (Schema[T]['default'] extends t.Type<any, any, any>
			? t.TypeOf<Schema[T]['default']>
			: Schema[T]['default']) {
	const val = retrieveKey(key);
	if (isRight(val)) {
		return val.value;
	} else {
		return schema[key].default as Schema[T]['default'] extends t.Type<
			any,
			any,
			any
		>
			? t.TypeOf<Schema[T]['default']>
			: Schema[T]['default'];
	}
}

function getFn<T extends FnSchemaKey>(key: T): ReturnType<FnSchema[T]> {
	return fnSchema[key]() as ReturnType<FnSchema[T]>;
}

function get<T extends SchemaKey | FnSchemaKey>(
	key: T,
): T extends SchemaKey
	? t.TypeOf<Schema[T]['type']> | Schema[T]['default']
	: T extends FnSchemaKey
	? ReturnType<FnSchema[T]>
	: never {
	if (schema.hasOwnProperty(key)) {
		return getSchema(key as SchemaKey);
	} else {
		return getFn(key as FnSchemaKey);
	}
}

type GetManyReturn<T extends SchemaKey> = {
	[key in T]: t.TypeOf<Schema[key]['type']> | Schema[key]['default']
};

function getMany<T extends SchemaKey>(keys: T[]): GetManyReturn<T> {
	return _.fromPairs(keys.map(k => [k, get(k)]));
}

const a = get('one');
const b = get('two');
const c = get('three');

if (a.indexOf('test')) {
	console.log('test');
}

const vals = getMany(['one', 'two', 'three']);
