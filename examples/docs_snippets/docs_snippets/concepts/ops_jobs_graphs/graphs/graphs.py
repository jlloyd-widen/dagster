# ruff: isort: skip_file


from dagster import graph, op, OpExecutionContext


@op
def my_op():
    pass


# start_graph_one
@op
def return_one(context: OpExecutionContext):
    return 1


@op
def add_one(context: OpExecutionContext, number: int):
    return number + 1


@graph
def one_plus_one():
    add_one(return_one())


# end_graph_two


# start_multiple_usage_graph
@graph
def multiple_usage():
    add_one(add_one(return_one()))


# end_multiple_usage_graph


# start_alias_graph
@graph
def alias():
    add_one.alias("second_addition")(add_one(return_one()))


# end_alias_graph
